const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { upload } = require("../middleware/index");
const path = require("path");
const fs = require("fs");
const JSZip = require("jszip");
const { sendNotificationAndEmail } = require("../_utils");
router.get("/mydrive", async (req, res) => {
  const { folder_id } = req.query;
  const { user_id } = req.user;
  try {
    let foldersQuery;
    if (folder_id) {
      foldersQuery = await db("dr_folders")
        .select("folder_id", "folder_name", "parent_id", "owner_id")
        .where("folder_id", folder_id)
        .andWhere("owner_id", user_id)
        .first();
    } else {
      foldersQuery = await db("dr_folders")
        .select("folder_id", "folder_name", "parent_id", "owner_id")
        .whereNull("parent_id")
        .andWhere("owner_id", user_id)
        .first();
    }

    if (!foldersQuery) {
      return res.status(404).json({ message: "Folder not found" });
    }

    foldersQuery.files = await db("dr_files")
      .select("file_id", "file_name", "file_path", "folder_id")
      .where("folder_id", foldersQuery.folder_id);

    foldersQuery.subFolders = await db("dr_folders")
      .select("folder_id", "folder_name", "parent_id", "owner_id")
      .where("parent_id", foldersQuery.folder_id)
      .andWhere("owner_id", user_id);

    res.status(200).json(foldersQuery);
  } catch (err) {
    console.error("Error fetching folders and files:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
router.post("/add-folder", async (req, res) => {
  const { folder_name, parent_id } = req.body;
  const { user_id } = req.user;

  if (!folder_name) {
    return res.status(400).json({ message: "Folder name is required" });
  }

  try {
    let newFolder;

    if (!parent_id) {
      const mainfolder = await db("dr_folders")
        .select("folder_id", "folder_name", "parent_id", "owner_id")
        .whereNull("parent_id")
        .andWhere("owner_id", user_id)
        .first();
      newFolder = {
        folder_name,
        parent_id: mainfolder.folder_id,
        owner_id: user_id,
      };
    } else {
      newFolder = {
        folder_name,
        parent_id,
        owner_id: user_id,
      };
    }

    const [folder_id] = await db("dr_folders").insert(newFolder);

    res.status(201).json({ folder_id, message: "Folder created successfully" });
  } catch (err) {
    console.error("Error creating folder:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
router.put("/folder", async (req, res) => {
  const { folder_id, new_folder_name } = req.body;
  const { user_id } = req.user;

  if (!folder_id || !new_folder_name) {
    return res
      .status(400)
      .json({ message: "Folder ID and new folder name are required" });
  }

  try {
    const folder = await db("dr_folders")
      .where("folder_id", folder_id)
      .andWhere("owner_id", user_id)
      .first();

    if (!folder) {
      return res
        .status(404)
        .json({ message: "Folder not found or unauthorized" });
    }

    await db("dr_folders")
      .where("folder_id", folder_id)
      .update({ folder_name: new_folder_name });

    res.status(200).json({ message: "Folder name updated successfully" });
  } catch (err) {
    console.error("Error updating folder name:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/folder", async (req, res) => {
  const { folder_id } = req.body;
  const { user_id } = req.user;

  if (!folder_id) {
    return res.status(400).json({ message: "Folder ID is required" });
  }

  try {
    const folder = await db("dr_folders")
      .where("folder_id", folder_id)
      .andWhere("owner_id", user_id)
      .first();

    if (!folder) {
      return res
        .status(404)
        .json({ message: "Folder not found or unauthorized" });
    }

    // Delete the folder
    await db("dr_folders").where("folder_id", folder_id).del();

    res.status(200).json({ message: "Folder deleted successfully" });
  } catch (err) {
    console.error("Error deleting folder:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
router.post("/upload-file", upload.single("file"), async (req, res) => {
  const { folder_id } = req.body;
  const { user_id } = req.user;
  const { originalname, path } = req.file;

  try {
    let folderToUse = null;
    if (folder_id) {
      const folder = await db("dr_folders")
        .where("folder_id", folder_id)
        .andWhere("owner_id", user_id)
        .first();

      if (!folder) {
        return res
          .status(404)
          .json({ message: "Folder not found or unauthorized" });
      }

      folderToUse = folder_id;
    } else {
      const mainFolder = await db("dr_folders")
        .whereNull("parent_id")
        .andWhere("owner_id", user_id)
        .first();

      if (!mainFolder) {
        return res
          .status(404)
          .json({ message: "Root folder not found for user" });
      }

      folderToUse = mainFolder.folder_id;
    }

    const uploadFilePath = path.replace(/\\/g, "/");

    const file = {
      file_name: originalname,
      file_path: "/" + uploadFilePath,
      folder_id: folderToUse,
      owner_id: user_id,
    };
    const sharedUsers = await db("dr_shared_folders")
      .where("folder_id", folderToUse)
      .select("user_id");

    if (sharedUsers.length > 0) {
      const notificationPromises = sharedUsers.map(async (sharedUser) => {
        await sendNotificationAndEmail(
          sharedUser.user_id,
          "Nouveau fichier ajouté",
          `Un nouveau fichier "${originalname}" a été ajouté dans le dossier partagé.`,
          `/dossiers-partage/${folderToUse}`,
          folderToUse
        );
      });

      await Promise.all(notificationPromises);
    }
    const [file_id] = await db("dr_files").insert(file);

    res.status(201).json({ file_id, message: "File uploaded successfully" });
  } catch (err) {
    console.error("Error uploading file:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
router.put("/rename-file", async (req, res) => {
  const { file_id, new_file_name } = req.body;
  const { user_id } = req.user;

  if (!file_id || !new_file_name) {
    return res
      .status(400)
      .json({ message: "File ID and new file name are required" });
  }

  try {
    const file = await db("dr_files")
      .where("file_id", file_id)
      .andWhere("owner_id", user_id)
      .first();

    if (!file) {
      return res
        .status(404)
        .json({ message: "File not found or unauthorized" });
    }

    await db("dr_files")
      .where("file_id", file_id)
      .update({ file_name: new_file_name });

    res.status(200).json({ message: "File name updated successfully" });
  } catch (err) {
    console.error("Error updating file name:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
router.delete("/file", async (req, res) => {
  const { file_id } = req.body;
  const { user_id } = req.user;

  if (!file_id) {
    return res.status(400).json({ message: "File ID is required" });
  }

  try {
    const file = await db("dr_files")
      .where("file_id", file_id)
      .andWhere("owner_id", user_id)
      .first();

    if (!file) {
      return res
        .status(404)
        .json({ message: "File not found or unauthorized" });
    }

    await db("dr_files").where("file_id", file_id).del();

    res.status(200).json({ message: "File deleted successfully" });
  } catch (err) {
    console.error("Error deleting file:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
router.get("/shared-withme", async (req, res) => {
  const { user_id } = req.user;

  try {
    const sharedFolders = await db("dr_shared_folders")
      .select(
        "dr_folders.folder_id",
        "dr_folders.folder_name",
        "dr_folders.parent_id",
        "dr_folders.owner_id",
        "w_users.user_full_name"
      )
      .leftJoin(
        "dr_folders",
        "dr_shared_folders.folder_id",
        "dr_folders.folder_id"
      )
      .leftJoin("w_users", "dr_folders.owner_id", "w_users.user_id")
      .where("dr_shared_folders.user_id", user_id);

    const sharedFiles = await db("dr_shared_files")
      .select(
        "dr_files.file_id",
        "dr_files.file_name",
        "dr_files.file_path",
        "dr_files.folder_id",
        "dr_files.owner_id",
        "w_users.user_full_name"
      )
      .leftJoin("dr_files", "dr_shared_files.file_id", "dr_files.file_id")
      .leftJoin("w_users", "dr_files.owner_id", "w_users.user_id")
      .where("dr_shared_files.user_id", user_id);

    const parentFolders = sharedFolders.filter((folder) => {
      return !sharedFolders.some((f) => f.folder_id === folder.parent_id);
    });

    const filteredSharedFiles = sharedFiles.filter((file) => {
      return parentFolders.some(
        (folder) => folder.folder_id === file.folder_id
      );
    });

    const sharedWithMe = {
      folders: parentFolders,
      files: filteredSharedFiles,
    };

    res.status(200).json(sharedWithMe);
  } catch (err) {
    console.error(
      "Erreur lors de la récupération des dossiers et fichiers partagés:",
      err
    );
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});
router.get("/shared-with/:type/:id", async (req, res) => {
  const { user_id } = req.user;
  const { type, id } = req.params;

  try {
    let sharedWithUsers;
    if (type === "folder") {
      sharedWithUsers = await db("dr_shared_folders as sf")
        .select("u.user_id", "u.user_full_name")
        .leftJoin("w_users as u", "sf.user_id", "u.user_id")
        .where("sf.folder_id", id)
        .andWhereNot("sf.user_id", user_id);
    } else if (type === "file") {
      sharedWithUsers = await db("dr_shared_files as sf")
        .select("u.user_id", "u.user_full_name")
        .leftJoin("w_users as u", "sf.user_id", "u.user_id")
        .where("sf.file_id", id)
        .andWhereNot("sf.user_id", user_id);
    } else {
      return res.status(400).json({ error: "Invalid type" });
    }

    res.status(200).json(sharedWithUsers);
  } catch (err) {
    console.error("Error fetching shared with users:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/shared-folder", async (req, res) => {
  const { folder_id } = req.query;
  const { user_id } = req.user;

  try {
    if (!folder_id) {
      return res.status(400).json({ message: "Folder ID is required" });
    }

    // Check if the main folder is shared with the user
    const isFolderShared = await db("dr_shared_folders")
      .where("folder_id", folder_id)
      .andWhere("user_id", user_id)
      .first();

    if (!isFolderShared) {
      return res.status(403).json({ message: "Folder is not shared with you" });
    }

    // Fetch the main folder details
    const foldersQuery = await db("dr_folders as df")
      .select(
        "df.folder_id",
        "df.folder_name",
        "df.parent_id",
        "df.owner_id",
        "wu.user_full_name as owner_name"
      )
      .leftJoin("w_users as wu", "df.owner_id", "wu.user_id")
      .where("df.folder_id", folder_id)
      .first();

    if (!foldersQuery) {
      return res.status(404).json({ message: "Folder not found" });
    }

    // Fetch files in the main folder
    foldersQuery.files = await db("dr_files")
      .select("file_id", "file_name", "file_path", "folder_id")
      .where("folder_id", folder_id);

    // Fetch subfolders shared with the user
    const subFolders = await db("dr_folders as df")
      .select("df.folder_id", "df.folder_name", "df.parent_id", "df.owner_id")
      .leftJoin("dr_shared_folders as dsf", function () {
        this.on("df.folder_id", "=", "dsf.folder_id").andOn(
          "dsf.user_id",
          "=",
          user_id
        );
      })
      .where("df.parent_id", folder_id)
      .andWhere(function () {
        this.where("df.owner_id", user_id).orWhereNotNull("dsf.user_id");
      });

    foldersQuery.subFolders = subFolders;

    res.status(200).json(foldersQuery);
  } catch (err) {
    console.error("Error fetching folders and files:", err);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});
router.post("/share-folder", async (req, res) => {
  const { id, users } = req.body;

  try {
    const existingSharedUsers = await db("dr_shared_folders")
      .where("folder_id", id)
      .pluck("user_id");

    // Log existing shared users for debugging

    const newSharedUsers = users.filter(
      (user_id) => !existingSharedUsers.includes(user_id)
    );
    const removedSharedUsers = existingSharedUsers.filter(
      (user_id) => !users.includes(user_id)
    );

    const promises = newSharedUsers.length
      ? newSharedUsers.map(async (user_id) => {
          if (!user_id) {
            console.error("Undefined user_id in newSharedUsers:", user_id);
            return;
          }
          await db("dr_shared_folders").insert({
            folder_id: id,
            user_id: user_id,
          });

          sendNotificationAndEmail(
            user_id,
            "Nouveau dossier partagé",
            `Vous avez été invité à accéder à un nouveau dossier.`,
            `/dossiers-partage/${id}`,
            id
          );
        })
      : [];

    const deletePromises = removedSharedUsers.length
      ? removedSharedUsers.map(async (user_id) => {
          if (!user_id) {
            console.error("Undefined user_id in removedSharedUsers:", user_id);
            return;
          }
          await db("dr_shared_folders")
            .where("folder_id", id)
            .andWhere("user_id", user_id)
            .del();

          sendNotificationAndEmail(
            user_id,
            "Accès retiré",
            `Votre accès au dossier a été retiré.`,
            `/dossiers-partage/${id}`,
            id
          );
        })
      : [];

    await Promise.all([...promises, ...deletePromises]);

    res.status(200).json({ message: "Dossier partagé avec succès" });
  } catch (err) {
    console.error("Erreur lors du partage du dossier:", err);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

module.exports = router;

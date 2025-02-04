const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { checkPermission, upload } = require("../middleware/index");
const fs = require("fs");
const path = require("path");
router.get("/norms", (req, res) => {
  try {
    db.select("*")
      .from("w_norms")
      .orderBy("norm_name")
      .then((data) => {
        res.status(200).json(data);
      });
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});
router.get("/norms/:id", (req, res) => {
  try {
    db.select("*")
      .from("w_norms")
      .where("norm_id", req.params.id)
      .then((data) => {
        if (data.length === 0) {
          res.status(404).json({ error: "Norme non trouvée" });
        } else {
          res.status(200).json(data[0]);
        }
      });
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});

//Add New Norm
router.post(
  "/norms",
  checkPermission("CanPOSTNorms"),
  upload.single("norm_pdf"),
  async (req, res) => {
    const trx = await db.transaction();
    try {
      const { norm_type, norm_name, norm_short_name, norm_summary, norm_year } =
        req.body;

      const normExists = await trx("w_norms")
        .select("*")
        .where("norm_name", norm_name);
      if (normExists.length > 0) {
        await trx.rollback();
        return res.status(409).json({
          error: "Norme déjà existante",
          description: `La norme "${norm_name}" existe déjà.`,
        });
      }
      const uploadPath = path.join(__dirname, "..", "norms");
      const filePath = path.join(uploadPath, req.file.filename);
      fs.renameSync(req.file.path, filePath);
      await trx("w_norms").insert({
        norm_type,
        norm_name,
        norm_short_name,
        norm_summary,
        norm_year,
        norm_pdf_url: `norms/${req.file.filename}`,
        norm_is_valid: 1,
      });
      await trx("w_activity_log").insert({
        user_id: req.user.user_id,
        action: "Norme Ajoutée",
        details: `Norme ${norm_short_name} ajoutée par ${req.user.user_full_name}`,
        timestamp: new Date(),
      });
      await trx.commit();
      res.status(200).json({
        success: "Norme ajoutée avec succès",
        description: `La norme "${norm_name}" a été ajoutée avec succès.`,
      });
    } catch (err) {
      await trx.rollback();
      console.error(err);
      return res.status(500).json({
        error: "Erreur interne du serveur",
      });
    }
  }
);
router.put("/norms/:id", checkPermission("CanPOSTNorms"), async (req, res) => {
  const trx = await db.transaction();
  try {
    const { id } = req.params;
    await trx("w_norms").where("norm_id", id).update({ norm_is_valid: 0 });
    await trx("w_activity_log").insert({
      user_id: req.user.user_id,
      action: "Norme Modifiée",
      details: `Norme ${id} modifiée par ${req.user.user_full_name}`,
      timestamp: new Date(),
    });
    await trx.commit();
    res.status(200).json({
      success: "Norme modifiée avec succès",
      description: `La norme "${id}" a été modifiée avec succès.`,
    });
  } catch (err) {
    await trx.rollback();
    console.error(err);
    return res.status(500).json({
      error: "Erreur interne du serveur",
    });
  }
});
router.delete(
  "/norms/:id",
  checkPermission("CanPOSTNorms"),
  async (req, res) => {
    const trx = await db.transaction();
    try {
      const { id } = req.params;
      await trx("w_norms").where("norm_id", id).del();
      await trx("w_activity_log").insert({
        user_id: req.user.user_id,
        action: "Norme Supprimée",
        details: `Norme ${id} supprimée par ${req.user.user_full_name}`,
        timestamp: new Date(),
      });
      const uploadPath = path.join(__dirname, "..", "norms");
      const filePath = path.join(uploadPath, req.body.norm_pdf_url);
      fs.unlinkSync(filePath);
      await trx.commit();
      res.status(200).json({
        success: "Norme supprimée avec succès",
        description: `La norme "${id}" a été supprimée avec succès.`,
      });
    } catch (err) {
      await trx.rollback();
      console.error(err);
      return res.status(500).json({
        error: "Erreur interne du serveur",
      });
    }
  }
);
module.exports = router;

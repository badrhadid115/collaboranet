const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { checkPermission } = require("../middleware/index");
const dayjs = require("dayjs");
const { GetNextTransactionId } = require("../_utils.js");
router.get("/banks", checkPermission("CanAccessFinApp"), async (_, res) => {
  try {
    const banks = await db.select("*").from("fi_banks");
    res.status(200).json(banks);
  } catch (err) {
    res.status(500).json(err);
    console.error(err);
  }
});
router.get("/benef", checkPermission("CanAccessFinApp"), async (_, res) => {
  try {
    const benef = await db
      .select(
        "*",
        db.raw(`
        CONCAT(
          IF(ben_rib IS NOT NULL, CONCAT('RIB: ', ben_rib, '\\n'), ''),
          IF(ben_iban IS NOT NULL, CONCAT('IBAN: ', ben_iban, '\\n'), ''),
          IF(ben_swift IS NOT NULL, CONCAT('SWIFT: ', ben_swift), '')
        ) AS ben_bank
      `)
      )
      .from("fi_ben")
      .orderBy("ben_name");

    res.status(200).json(benef);
  } catch (err) {
    res.status(500).json(err);
    console.error(err);
  }
});

router.get("/trans", checkPermission("CanAccessFinApp"), async (_, res) => {
  try {
    const transactions = await db
      .select("*", db.raw("DATE_FORMAT(trans_date, '%d/%m/%Y') as trans_date"))
      .from("fi_transactions")
      .join("fi_banks", "fi_transactions.trans_fk_bank_id", "fi_banks.bank_id")
      .join("fi_ben", "fi_transactions.trans_fk_ben_id", "fi_ben.ben_id")
      .orderBy("trans_id", "desc");
    res.status(200).json(transactions);
  } catch (err) {
    res.status(500).json(err);
    console.error(err);
  }
});
router.post("/banks", async (req, res) => {
  try {
    const { bank_name, bank_address, bank_rib } = req.body;
    const existingRIB = await db
      .select("*")
      .from("fi_banks")
      .where("bank_rib", bank_rib);
    if (existingRIB.length > 0) {
      return res.status(409).json({
        error: "Banque déjà existante",
        description: "Banque déjà existante, veuillez en choisir une autre",
      });
    }
    await db.transaction(async (trx) => {
      await trx("fi_banks").insert({ bank_name, bank_address, bank_rib });
      await trx("w_activity_log").insert({
        user_id: req.user.user_id,
        action: "Banque ajoutée",
        details: `La banque "${bank_name}" ajouté par ${req.user.user_full_name}`,
        timestamp: new Date(),
      });
      res.status(200).json({
        success: "Banque ajoutée avec succès",
        description: `La banque "${bank_name}" a été ajoutée avec succès`,
      });
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Erreur interne du serveur",
      description: "Veuillez contacter l'administrateur",
    });
  }
});
router.post("/benef", async (req, res) => {
  try {
    const { ben_name, ben_ice, ben_address, ben_iban, ben_swift, ben_rib } =
      req.body;
    console.log(ben_name, ben_ice, ben_address, ben_iban, ben_swift, ben_rib);
    const existingBen = await db
      .select("*")
      .from("fi_ben")
      .where("ben_name", ben_name);
    if (existingBen.length > 0) {
      return res.status(409).json({
        error: "Bénéficiaire déjà existant",
        description:
          "Bénéficiaire déjà existant, veuillez en choisir une autre",
      });
    }
    await db.transaction(async (trx) => {
      await trx("fi_ben").insert({
        ben_name,
        ben_ice,
        ben_address,
        ben_iban,
        ben_swift,
        ben_rib,
      });
      await trx("w_activity_log").insert({
        user_id: req.user.user_id,
        action: "Bénéficiaire ajouté",
        details: `Le bénéficiaire "${ben_name}" ajouté par ${req.user.user_full_name}`,
        timestamp: new Date(),
      });
      res.status(200).json({
        success: "Bénéficiaire ajouté avec succès",
        description: `Le bénéficiaire "${ben_name}" a été ajouté avec succès`,
      });
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Erreur interne du serveur",
      description: "Veuillez contacter l'administrateur",
    });
  }
});
router.post("/transaction", async (req, res) => {
  try {
    const {
      trans_date,
      trans_object,
      trans_nature,
      trans_amount,
      trans_invoice,
      trans_currency,
      trans_fk_bank_id,
      trans_fk_ben_id,
    } = req.body;

    const transaction_full_id = await GetNextTransactionId();
    await db.transaction(async (trx) => {
      await trx("fi_transactions").insert({
        trans_full_id: transaction_full_id,
        trans_date,
        trans_object,
        trans_nature,
        trans_amount,
        trans_invoice,
        trans_currency,
        trans_fk_bank_id,
        trans_fk_ben_id,
      });
      await trx("w_activity_log").insert({
        user_id: req.user.user_id,
        action: "Ordre de Virement ajouté",
        details: `Ordre de Virement "${transaction_full_id}" ajouté par ${req.user.user_full_name}`,
        timestamp: new Date(),
      });
      res.status(200).json({
        success: "Ordre de virement ajouté avec succès",
        description: `Ordre de virement "${transaction_full_id}" a été ajouté avec succès`,
      });
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Erreur interne du serveur",
      description: "Veuillez contacter l'administrateur",
    });
  }
});
router.put("/banks/:bank_id", async (req, res) => {
  try {
    const { bank_name, bank_address, bank_rib } = req.body;
    const { bank_id } = req.params;

    const existingBank = await db
      .select("*")
      .from("fi_banks")
      .where("bank_id", bank_id)
      .first();

    if (!existingBank) {
      return res.status(404).json({
        error: "Banque non trouvée",
        description: "La banque spécifiée n'existe pas",
      });
    }

    const existingRIB = await db
      .select("*")
      .from("fi_banks")
      .where("bank_rib", bank_rib)
      .andWhereNot("bank_id", bank_id)
      .first();

    if (existingRIB) {
      return res.status(409).json({
        error: "RIB déjà utilisé",
        description: "Un autre compte utilise déjà ce RIB",
      });
    }

    await db("fi_banks")
      .where("bank_id", bank_id)
      .update({ bank_name, bank_address, bank_rib });
    await db("w_activity_log").insert({
      user_id: req.user.user_id,
      action: "Banque modifiée",
      details: `La banque "${bank_name}" modifié par ${req.user.user_full_name}`,
      timestamp: new Date(),
    });
    res.status(200).json({
      success: "Banque mise à jour avec succès",
      description: `La banque "${bank_name}" a été mise à jour avec succès`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Erreur interne du serveur",
      description: "Veuillez contacter l'administrateur",
    });
  }
});
router.put("/benef/:ben_id", async (req, res) => {
  try {
    const { ben_name, ben_ice, ben_address, ben_iban, ben_swift, ben_rib } =
      req.body;
    const { ben_id } = req.params;

    const existingBen = await db
      .select("*")
      .from("fi_ben")
      .where("ben_id", ben_id)
      .first();

    if (!existingBen) {
      return res.status(404).json({
        error: "Bénéficiaire non trouvé",
        description: "Le bénéficiaire spécifié n'existe pas",
      });
    }

    const existingDuplicate = await db
      .select("*")
      .from("fi_ben")
      .where("ben_name", ben_name)
      .andWhereNot("ben_id", ben_id)
      .first();

    if (existingDuplicate) {
      return res.status(409).json({
        error: "Bénéficiaire déjà existant",
        description: "Un autre bénéficiaire a déjà ces détails",
      });
    }

    await db("fi_ben").where("ben_id", ben_id).update({
      ben_name,
      ben_ice,
      ben_address,
      ben_iban,
      ben_swift,
      ben_rib,
    });
    await db("w_activity_log").insert({
      user_id: req.user.user_id,
      action: "Bénéficiaire modifié",
      details: `Le bénéficiaire "${ben_name}" a été par ${req.user.user_full_name}`,
      timestamp: new Date(),
    });
    res.status(200).json({
      success: "Bénéficiaire mis à jour avec succès",
      description: `Le bénéficiaire ${ben_name} a été mis à jour avec succès`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Erreur interne du serveur",
      description: "Veuillez contacter l'administrateur",
    });
  }
});
router.put("/transaction/:trans_id", async (req, res) => {
  try {
    const {
      trans_date,
      trans_object,
      trans_nature,
      trans_amount,
      trans_invoice,
      trans_currency,
      trans_fk_bank_id,
      trans_fk_ben_id,
    } = req.body;
    const { trans_id } = req.params;
    const amount = trans_amount * 100;

    const existingTrans = await db
      .select("*")
      .from("fi_transactions")
      .where("trans_id", trans_id)
      .first();

    if (!existingTrans) {
      return res.status(404).json({
        error: "Transaction non trouvée",
        description: "La transaction spécifiée n'existe pas",
      });
    }

    const existingConflict = await db
      .select("*")
      .from("fi_transactions")
      .where("trans_amount", amount)
      .andWhere("trans_invoice", trans_invoice)
      .andWhere("trans_fk_ben_id", trans_fk_ben_id)
      .andWhereNot("trans_id", trans_id)
      .first();

    if (existingConflict) {
      return res.status(409).json({
        error: "Transaction déjà existante",
        description: "Une autre transaction avec les mêmes détails existe déjà",
      });
    }

    await db("fi_transactions").where("trans_id", trans_id).update({
      trans_date,
      trans_object,
      trans_nature,
      trans_amount: amount,
      trans_invoice,
      trans_currency,
      trans_fk_bank_id,
      trans_fk_ben_id,
    });
    await db("w_activity_log").insert({
      user_id: req.user.user_id,
      action: "Ordre de Virement modifié",
      details: `Ordre de Virement ${trans_id} modifié par ${req.user.user_full_name}`,
      timestamp: new Date(),
    });
    res.status(200).json({
      success: "Transaction mise à jour avec succès",
      description: `La transaction avec ID ${trans_id} a été mise à jour avec succès`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Erreur interne du serveur",
      description: "Veuillez contacter l'administrateur",
    });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const db = require("../config/db");
router.get("/health", (_, res) => {
  res.sendStatus(200);
});
router.get("/dbhealth", (_, res) => {
  db.raw("SELECT 1")
    .then(() => {
      res.sendStatus(200);
    })
    .catch((error) => {
      res.status(500).json({ error: "Database error", message: error.code });
    });
});
router.get("/cards", async (req, res) => {
  let cards = {
    clients: 0,
    files: 0,
    samples: 0,
    reports: 0,
    tests: 0,
    devis: 0,
    purchases: 0,
    total: 0,
    filesByYou: 0,
  };
  const CanViewComm =
    req && req.user && req.user.permissions.includes("CanAccessCommercialApp");
  try {
    const clientsCount = await db("w_clients").count("* as count");
    const filesCount = await db("es_files").count("* as count");
    const samplesCount = await db("es_samples").count("* as count");
    const reportsCount = await db("es_reports").count("* as count");
    const testsCount = await db("co_e_devis_elements").sum(
      "element_quantity as sum"
    );
    const devisCount = await db("co_devis").count("* as count");
    const purchasesCount = await db("co_purchases").count("* as count");
    const totalSum = await db("co_devis")
      .join(
        "co_invoices",
        "co_devis.devis_id",
        "co_invoices.invoice_fk_devis_id"
      )
      .sum("co_devis.devis_total_ht as sum");
    const filesByYouCount = await db("es_files")
      .count("* as count")
      .where("es_file_fk_resp_id", req.user.user_id)
      .orWhere("es_file_fk_tech_id", req.user.user_id);
    cards.clients = clientsCount[0].count;
    cards.files = filesCount[0].count;
    cards.samples = samplesCount[0].count;
    cards.reports = reportsCount[0].count;
    cards.tests = Math.round(testsCount[0].sum);
    cards.devis = devisCount[0].count;
    cards.purchases = purchasesCount[0].count;
    cards.total = CanViewComm ? totalSum[0].sum : 0;
    cards.filesByYou = filesByYouCount[0].count;

    res.status(200).json(cards);
  } catch (err) {
    console.error("Error fetching card data:", err);
    res.status(500).json({
      title: "Error fetching card data",
      subtitle: "Internal error, please contact the administrator",
    });
  }
});
router.get("/dashboard", (req, res) => {
  res.status(200).json({ user: req.user.user_full_name });
});
router.get("/holidays", async (req, res) => {
  try {
    const holidays = await db
      .select(
        db.raw("DATE_FORMAT(holiday_date, '%d/%m/%Y') as holiday_date")
      )
      .from("w_holidays");
    res.status(200).json(holidays);
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});
module.exports = router;

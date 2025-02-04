const { db } = require('../config');
const dayjs = require('dayjs');
async function GetNextMethodFullId() {
  try {
    const data = await db('co_methods').max('method_full_id as max').first();

    const currentId = data.max;
    let nextId;

    if (currentId === null) {
      nextId = 'M0001';
    } else {
      let currentNumber = currentId.substring(1, 5);
      let nextNumber = Number(currentNumber) + 1;
      nextId = `M${nextNumber.toString().padStart(4, '0')}`;
    }

    return nextId;
  } catch (err) {
    throw new Error(`Error calculating next method full ID: ${err.message}`);
  }
}

async function GetNextLabTestFullId() {
  try {
    const data = await db('co_labtests').max('labtest_full_id as max').first();

    const currentId = data.max;
    let nextId;

    if (currentId === null) {
      nextId = 'E0001';
    } else {
      let currentNumber = currentId.substring(1, 5);
      let nextNumber = Number(currentNumber) + 1;
      nextId = `E${nextNumber.toString().padStart(4, '0')}`;
    }

    return nextId;
  } catch (err) {
    throw new Error(`Error calculating next method full ID: ${err.message}`);
  }
}
async function GetNextDevisFullId(date = new Date()) {
  try {
    const data = await db('co_devis')
      .max('devis_full_id as max')
      .where(db.raw('YEAR(devis_date) = ?', [dayjs(date).year()]))
      .first();
    const currentId = data.max;
    let nextId;

    if (currentId === null) {
      nextId = `${dayjs(date).year().toString().slice(-2)}D0001`;
    } else {
      let currentNumber = currentId.substring(3, 7);
      let nextNumber = Number(currentNumber) + 1;
      nextId = `${dayjs(date).year().toString().slice(-2)}D${nextNumber.toString().padStart(4, '0')}`;
    }

    return nextId;
  } catch (err) {
    throw new Error(`Error calculating next devis full ID: ${err.message}`);
  }
}
async function GetNextInvoiceFullId(date = new Date()) {
  try {
    const data = await db('co_invoices')
      .max('invoice_full_id as max')
      .where(db.raw('YEAR(invoice_date) = ?', [dayjs(date).year()]))
      .first();
    const currentId = data.max;
    let nextId;

    if (currentId === null) {
      nextId = `${dayjs(date).year().toString().slice(-2)}F0001`;
    } else {
      let currentNumber = currentId.substring(3, 7);
      let nextNumber = Number(currentNumber) + 1;
      nextId = `${dayjs(date).year().toString().slice(-2)}F${nextNumber.toString().padStart(4, '0')}`;
    }

    return nextId;
  } catch (err) {
    throw new Error(`Error calculating next invoice full ID: ${err.message}`);
  }
}
/*
  async function GetNextDevisId() {
    try {
      const data = await db
        .select("*")
        .from("co_devis")
        .max({ max: "devis_full_id" });
  
      const currentId = data[0].max;
      const year = new Date().getFullYear().toString().slice(-2);
  
      if (!currentId) {
        return `${year}D0001`;
      }
  
      const currentYear = parseInt(currentId.slice(0, 2));
      const currentNumber = parseInt(currentId.slice(3));
  
      if (currentYear === parseInt(year)) {
        const nextNumber = (currentNumber + 1).toString().padStart(4, "0");
        return `${year}D${nextNumber}`;
      } else {
        return `${year}D0001`;
      }
    } catch (err) {
      throw new Error("Error fetching the next devis ID: " + err.message);
    }
  }
  async function GetNextTemplateId() {
    try {
      const data = await db("co_templates").max({ max: "template_full_id" });
  
      const currentId = data[0].max;
      if (!currentId) {
        return "MD0001";
      }
      const currentNumber = parseInt(currentId.slice(2));
      const nextNumber = (currentNumber + 1).toString().padStart(4, "0");
      return `MD${nextNumber}`;
    } catch (err) {
      throw new Error("Error fetching the next template ID: " + err.message);
    }
  }
  async function GetNextPurchaseOrderId() {
    try {
      const fullyear = new Date().getFullYear();
      const data = await db
        .select("*")
        .from("co_purchases")
        .whereRaw("YEAR(purchase_date) = ?", [fullyear])
        .max({ max: "purchase_full_id" });
  
      const currentId = data[0].max;
      const year = String(new Date().getFullYear()).slice(-2);
      let nextId;
  
      if (!currentId) {
        nextId = `CC 0001-${year}`;
      } else {
        const currentYear = currentId.slice(-2);
        const currentNumber = currentId.slice(3, 7);
  
        if (currentYear === year) {
          const nextNumber = (parseInt(currentNumber, 10) + 1)
            .toString()
            .padStart(4, "0");
          nextId = `CC ${nextNumber}-${year}`;
        } else {
          nextId = `CC 0001-${year}`;
        }
      }
  
      return nextId;
    } catch (err) {
      throw err;
    }
  }
  async function GetNextInvoiceId() {
    try {
      const data = await db
        .select("*")
        .from("co_invoices")
        .max({ max: "invoice_full_id" });
  
      const currentId = data[0].max;
      let nextId;
      const year = String(new Date().getFullYear()).slice(-2);
  
      if (currentId === null) {
        nextId = `${year}F0001`;
      } else {
        const currentYear = currentId.slice(0, 2);
        const currentNumber = currentId.slice(3, 7);
  
        if (currentYear === year) {
          const nextNumber = Number(currentNumber) + 1;
          nextId = `${year}F${nextNumber.toString().padStart(4, "0")}`;
        } else {
          nextId = `${year}F0001`;
        }
      }
  
      return nextId;
    } catch (err) {
      throw err;
    }
  }
  async function GetNextDNId() {
    try {
      const data = await db
        .select("*")
        .from("co_delivery_notes")
        .max({ max: "dn_full_id" });
  
      const currentId = data[0].max;
      let nextId;
      const year = String(new Date().getFullYear()).slice(-2);
  
      if (currentId === null) {
        nextId = `${year}BL0001`;
      } else {
        const currentYear = currentId.slice(0, 2);
        const currentNumber = currentId.slice(4, 8);
  
        if (currentYear === year) {
          const nextNumber = Number(currentNumber) + 1;
          nextId = `${year}BL${nextNumber.toString().padStart(4, "0")}`;
        } else {
          nextId = `${year}BL0001`;
        }
      }
  
      return nextId;
    } catch (err) {
      throw err;
    }
  }
  async function GetNextCNId() {
    try {
      const data = await db
        .select("*")
        .from("co_credit_notes")
        .max({ max: "cn_full_id" });
  
      const currentId = data[0].max;
      let nextId;
      const year = String(new Date().getFullYear()).slice(-2);
  
      if (currentId === null) {
        nextId = `${year}A0001`;
      } else {
        const currentYear = currentId.slice(0, 2);
        const currentNumber = currentId.slice(3, 7);
  
        if (currentYear === year) {
          const nextNumber = Number(currentNumber) + 1;
          nextId = `${year}A${nextNumber.toString().padStart(4, "0")}`;
        } else {
          nextId = `${year}A0001`;
        }
      }
  
      return nextId;
    } catch (err) {
      throw err;
    }
  }
  async function GetNextSampleId() {
    try {
      const data = await db
        .select(
          db.raw("MAX(CAST(SUBSTR(es_sample_full_id, 3) AS UNSIGNED)) AS max")
        )
        .from("es_samples")
        .whereRaw(`SUBSTR(es_sample_full_id, 1, 2) = ?`, [
          String(new Date().getFullYear()).slice(-2),
        ]);
  
      const currentYear = String(new Date().getFullYear()).slice(-2);
      const currentMaxId = data[0].max;
  
      let nextId;
  
      if (currentMaxId === null) {
        nextId = `${currentYear}0001`;
      } else {
        const nextNumber = Number(currentMaxId) + 1;
        nextId = `${currentYear}${nextNumber.toString().padStart(4, "0")}`;
      }
  
      return nextId;
    } catch (err) {
      console.error("Error generating next sample ID:", err);
      throw err;
    }
  }
  async function GetNextReportId() {
    try {
      const data = await db
        .select("*")
        .from("es_reports")
        .where(db.raw("YEAR(es_report_date) = YEAR(CURRENT_DATE())"))
        .max({ es_report_full_id: "es_report_full_id" });
  
      const currentId = data[0].es_report_full_id;
      let nextId;
      const year = String(new Date().getFullYear()).slice(-2);
  
      if (currentId === null) {
        nextId = `20001${year}R`;
      } else {
        const currentYear = currentId.toString().slice(5, 7);
        const currentNumber = currentId.toString().slice(1, 5);
        if (currentYear === year) {
          const nextNumber = Number(currentNumber) + 1;
          nextId = `2${nextNumber.toString().padStart(4, "0")}${year}R`;
        } else {
          nextId = `20001${year}R`;
        }
      }
  
      return nextId;
    } catch (err) {
      throw err;
    }
  }
  async function GetNextClientFileId() {
    try {
      const data = await db
        .select("*")
        .from("es_files")
        .where(db.raw("YEAR(es_file_creation_time) = YEAR(CURRENT_DATE())"))
        .max({ max: "es_file_full_id" });
  
      const currentId = data[0].max;
      const year = String(new Date().getFullYear());
  
      if (currentId === null) {
        return `DC 0001-${year}`;
      } else {
        const currentYear = currentId.toString().slice(-4);
        const currentNumber = currentId.slice(3, 7);
  
        if (currentYear === year) {
          const nextNumber = Number(currentNumber) + 1;
          return `DC ${nextNumber.toString().padStart(4, "0")}-${year}`;
        } else {
          return `DC 0001-${year}`;
        }
      }
    } catch (err) {
      console.error("Error fetching next client file ID:", err);
      throw err;
    }
  }
  async function GetNextTaskId() {
    try {
      const lastTask = await db("es_tasks")
        .select("task_full_id")
        .orderBy("task_full_id", "desc")
        .first();
  
      const currentYear = new Date().getFullYear().toString().slice(-2);
  
      if (!lastTask) {
        return `T0001-${currentYear}`;
      }
  
      const lastTaskId = lastTask.task_full_id;
      const lastTaskYear = lastTaskId.slice(-2);
      const lastTaskNumber = parseInt(lastTaskId.slice(1, 5));
  
      if (lastTaskYear === currentYear) {
        const newTaskNumber = (lastTaskNumber + 1).toString().padStart(4, "0");
        return `T${newTaskNumber}-${currentYear}`;
      } else {
        return `T0001-${currentYear}`;
      }
    } catch (err) {
      console.error("Error fetching the last task ID:", err);
    }
    throw new Error("Failed to generate the next task ID");
  }
  async function GetNextTransactionId() {
    try {
      const lastTransaction = await db("fi_transactions")
        .select("trans_full_id")
        .orderBy("trans_full_id", "desc")
        .first();
      const currentYear = new Date().getFullYear().toString().slice(-2);
      const currentMonth = new Date().getMonth() + 1;
      const currentMonthString = currentMonth.toString().padStart(2, "0");
  
      if (!lastTransaction) {
        return `${currentYear}${currentMonthString}01O`;
      }
  
      const lastTransactionId = lastTransaction.trans_full_id;
      const lastTransactionYear = lastTransactionId.slice(0, 2);
      const lastTransactionMonth = lastTransactionId.slice(2, 4);
      const lastTransactionNumber = parseInt(lastTransactionId.slice(4, 6));
      if (
        lastTransactionYear === currentYear &&
        lastTransactionMonth === currentMonthString
      ) {
        const newTransactionNumber = (lastTransactionNumber + 1)
          .toString()
          .padStart(2, "0");
        return `${currentYear}${currentMonthString}${newTransactionNumber}O`;
      } else {
        return `${currentYear}${currentMonthString}01O`;
      }
    } catch (err) {
      console.error("Error fetching the last transaction ID:", err);
      throw err;
    }
  }
    */
module.exports = { GetNextMethodFullId, GetNextLabTestFullId, GetNextDevisFullId, GetNextInvoiceFullId };

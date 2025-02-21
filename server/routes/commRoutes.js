/* eslint-disable no-unused-vars */
const express = require('express');
const router = express.Router();

//const JSZip = require('jszip');
//const fs = require('fs');
//const path = require('path');
const dayjs = require('dayjs');

const { db } = require('../config');
const { GetNextMethodFullId, GetNextLabTestFullId, GetNextDevisFullId, GetNextInvoiceFullId } = require('../utils');
const { checkPermission, upload } = require('../middleware');
const messages = require('../messages');
router.get('/acc', checkPermission('CanAccessCommercialApp'), async (_, res) => {
  try {
    const acc = await db('co_acc')
      .select('acc_id AS value', db.raw('CONCAT(acc_name, " [", acc_desc, "]") AS label'))
      .whereNot('acc_id', 0)
      .andWhere('acc_is_active', 1);
    res.status(200).json(acc);
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});
router.get('/sectors', async (_, res) => {
  try {
    const sectors = await db
      .select('sector_id AS value', 'sector_name AS label')
      .from('co_sectors')
      .orderBy('sector_name')
      .whereNot('sector_id', 0);
    res.status(200).json(sectors);
  } catch (err) {
    res.status(500).json(err);
    console.error(err);
  }
});
router.get('/client-types', async (_, res) => {
  try {
    const clientTypes = await db
      .select('client_type_id AS value', 'client_type_name AS label')
      .from('co_client_types')
      .whereNot('client_type_id', 0)
      .orderBy('client_type_name');
    res.status(200).json(clientTypes);
  } catch (err) {
    res.status(500).json(err);
    console.error(err);
  }
});
router.get('/types', async (_, res) => {
  try {
    const types = await db.select('type_id AS value', 'type_name AS label').from('co_types').orderBy('type_name').whereNot('type_id', 0);
    res.status(200).json(types);
  } catch (err) {
    res.status(500).json(err);
    console.error(err);
  }
});
router.get('/modalities', async (_, res) => {
  try {
    const modalities = await db.select('modality_id AS value', 'modality_name AS label').from('co_modalities').whereNot('modality_id', 0);
    res.status(200).json(modalities);
  } catch (err) {
    res.status(500).json(err);
    console.error(err);
  }
});
router.get('/clients', checkPermission('CanViewClients'), async (req, res) => {
  try {
    const clients = await db.select('*').from('clients');
    res.status(200).json(clients);
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});
router.get('/clients-by-id/:id', checkPermission('CanViewClients'), async (req, res) => {
  try {
    const id = req.params.id;
    const clients = await db.select('*').from('co_clients').where('client_id', id).first();
    res.status(200).json(clients);
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});
/*
router.get('/clients/:name', checkPermission('CanViewClients'), async (req, res) => {
  try {
    const clientName = req.params.name;

    const clientData = await db('w_clients')
      .leftJoin('w_client_segment', 'w_clients.client_fk_segment', 'w_client_segment.segment_id')
      .leftJoin('w_client_subsegment', 'w_clients.client_fk_subsegment', 'w_client_subsegment.subsegment_id')
      .where('client_name', clientName)
      .first();

    if (!clientData) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    const clientId = clientData.client_id;

    const files = await db('es_files')
      .leftJoin('w_users', 'es_files.es_file_fk_resp_id', 'w_users.user_id')
      .select(
        'es_files.es_file_full_id',
        db.raw("DATE_FORMAT(es_files.es_file_opening_date, '%d/%m/%Y') as opening_date"),
        db.raw("DATE_FORMAT(es_files.es_file_exit_date, '%d/%m/%Y') as exit_date"),
        db.raw("DATE_FORMAT(es_files.es_file_closing_date, '%d/%m/%Y') as closing_date"),
        'es_file_statuses.status_name',
        'w_users.user_full_name as es_file_resp_name'
      )
      .leftJoin('es_file_statuses', 'es_files.es_file_fk_status_id', 'es_file_statuses.status_id')
      .where('es_file_fk_client_id', clientId)
      .orderBy('es_file_full_id', 'desc');

    const devis = await db('co_devis')
      .leftJoin('co_devis_statuses', 'co_devis.devis_fk_status', 'co_devis_statuses.status_id')
      .select(
        'co_devis.devis_full_id',
        'co_devis.devis_version',
        db.raw(
          "CONCAT(co_devis.devis_full_id, IF(co_devis.devis_version > 0, CONCAT('.V', co_devis.devis_version), '')) as devis_formatted_id"
        ),
        db.raw("DATE_FORMAT(devis_date, '%d/%m/%Y') as devis_date"),
        'co_devis.devis_object',
        'co_devis.devis_total_ht',
        'co_devis.devis_total_ttc',
        'co_devis_statuses.status_name'
      )
      .where('devis_fk_client_id', clientId)
      .orderBy('devis_full_id', 'desc');

    const purchases = await db('co_purchases')
      .select(
        'co_purchases.purchase_full_id',
        db.raw("DATE_FORMAT(co_purchases.purchase_date, '%d/%m/%Y') as purchase_date"),
        'co_purchases.purchase_designation',
        'co_purchases.purchase_order_ref'
      )
      .where('purchase_fk_client_id', clientId)
      .orderBy('purchase_full_id', 'desc');

    const samples = await db('es_samples')
      .select('es_samples.*', db.raw("DATE_FORMAT(es_samples.es_sample_date, '%d/%m/%Y') as sample_date"))
      .where('es_sample_fk_client_id', clientId)
      .orderBy('es_sample_full_id', 'desc');

    const reports = await db('es_reports')
      .select(
        'es_reports.es_report_full_id',
        db.raw("DATE_FORMAT(es_reports.es_report_date, '%d/%m/%Y') as report_date"),
        'es_reports.es_report_type'
      )
      .where('es_report_fk_client_id', clientId)
      .orderBy('es_report_full_id', 'desc');

    const invoices = await db('co_invoices')
      .leftJoin('co_devis', 'co_invoices.invoice_fk_devis_id', 'co_devis.devis_id')
      .select(
        'co_invoices.invoice_full_id',
        db.raw("DATE_FORMAT(co_invoices.invoice_date, '%d/%m/%Y') as invoice_date"),
        'co_devis.devis_total_ht',
        'co_devis.devis_total_ttc'
      )
      .where('co_devis.devis_fk_client_id', clientId)
      .orderBy('invoice_full_id', 'desc');

    const referenceMonths = Array.from({ length: 12 }, (_, index) => {
      const currentDate = new Date();
      currentDate.setMonth(currentDate.getMonth() - index);
      return currentDate.toISOString().slice(0, 7);
    });

    const barchart = await db('es_files')
      .select(db.raw("DATE_FORMAT(es_file_opening_date, '%Y-%m') as month_year"), db.raw('COUNT(es_file_id) as file_count'))
      .where('es_file_fk_client_id', clientId)
      .andWhere('es_file_opening_date', '>', db.raw('CURDATE() - INTERVAL 12 MONTH'))
      .groupBy('month_year')
      .orderBy('month_year', 'desc');

    const mergedBarchartData = referenceMonths.map(
      (monthYear) =>
        barchart.find((data) => data.month_year === monthYear) || {
          month_year: monthYear,
          file_count: 0
        }
    );

    const clientDetails = {
      ...clientData,
      files,
      devis,
      purchases,
      samples,
      reports,
      invoices,
      barchart: mergedBarchartData.reverse()
    };

    res.status(200).json(clientDetails);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
*/
router.post('/clients', checkPermission('CanPOSTClients'), async (req, res) => {
  const trx = await db.transaction();
  try {
    let client = req.body;
    client = {
      ...client,
      client_name: client.client_name.toUpperCase(),
      client_city: client.client_city.toUpperCase()
    };

    let query = trx('co_clients').select('*').where('client_name', client.client_name);

    if (client.client_ice) {
      query = query.orWhere('client_ice', client.client_ice);
    }
    const existingClients = await query;

    if (existingClients.length > 0) {
      await trx.rollback();
      return res.status(409).json(messages.existingClient);
    }

    await trx('co_clients').insert(client);

    await trx('au_activity_log').insert({
      log_fk_user_id: req.user.user_id,
      log_action: 'Client ajouté',
      log_details: `Client "${client.client_name}" ajouté par ${req.user.user_full_name}`
    });

    await trx.commit();

    res.status(200).json(messages.clientAdded(client.client_name));
  } catch (err) {
    trx.rollback();
    console.error('Error adding client:', err);
    return res.status(500).json(messages.serverError);
  }
});

router.put('/clients', checkPermission('CanPOSTClients'), async (req, res) => {
  const trx = await db.transaction();

  try {
    let client = req.body;

    client = {
      ...client,
      client_name: client.client_name.toUpperCase(),
      client_city: client.client_city.toUpperCase()
    };

    const existingClient = await trx('co_clients').select('*').where('client_id', client.client_id).first();

    if (!existingClient) {
      await trx.commit();
      return res.status(400).json(messages.nonExistingClient);
    }

    const duplicateClients = await trx('co_clients')
      .select('*')
      .where(function () {
        this.where('client_name', client.client_name);

        if (client.client_ice && client.client_ice.trim() !== '') {
          this.orWhere('client_ice', client.client_ice);
        }
      })
      .andWhereNot('client_id', client.client_id);

    if (duplicateClients.length > 0) {
      await trx.commit();
      return res.status(409).json(messages.existingClient);
    }

    await trx('co_clients').where('client_id', client.client_id).update(client);

    await trx('au_activity_log').insert({
      log_fk_user_id: req.user.user_id,
      log_action: 'Client modifié',
      log_details: `Client "${client.client_name}" modifié par ${req.user.user_full_name}`
    });

    await trx.commit();

    return res.status(200).json(messages.clientModified(client.client_name));
  } catch (err) {
    console.error('Error updating client:', err);
    await trx.rollback();
    return res.status(500).json({
      error: 'Erreur interne du serveur',
      description: "Veuillez contacter l'administrateur"
    });
  }
});

router.get('/methods', checkPermission('CanAccessCommercialApp'), async (_, res) => {
  try {
    const methods = await db.select('*').from('methods');
    res.status(200).json(methods);
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});
router.get('/methods/:id', checkPermission('CanAccessCommercialApp'), async (req, res) => {
  const id = req.params.id;
  try {
    const method = await db
      .select('method_id', 'method_name', 'method_fk_acc_id', 'method_is_valid')
      .from('co_methods')
      .where('method_id', id)
      .first();
    res.status(200).json(method);
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});
router.post('/methods', checkPermission('CanPOSTMethods'), async (req, res) => {
  const method = req.body;
  const trx = await db.transaction();

  try {
    if (!method.method_name || !method.method_fk_acc_id) {
      return res.status(400).json(messages.Error400);
    }

    const existingMethod = await trx
      .select('method_name', 'method_fk_acc_id')
      .from('co_methods')
      .where('method_name', method.method_name)
      .andWhere('method_fk_acc_id', method.method_fk_acc_id)
      .first();

    if (existingMethod) {
      await trx.rollback();
      return res.status(409).json(messages.existingMethod);
    }

    const acc = await trx('co_acc').select('acc_id').where('acc_id', method.method_fk_acc_id).first();
    if (!acc) {
      await trx.rollback();
      return res.status(400).json(messages.nonExistingAcc);
    }

    const nextMethodFullId = await GetNextMethodFullId();

    await trx('co_methods').insert({
      method_full_id: nextMethodFullId,
      method_name: method.method_name,
      method_fk_acc_id: method.method_fk_acc_id
    });

    await db('au_activity_log').insert({
      log_fk_user_id: req.user.user_id,
      log_action: 'Méthode ajoutée',
      log_details: `Méthode "${method.method_name}" ajoutée par ${req.user.user_full_name}`
    });

    await trx.commit();
    return res.status(200).json(messages.methodAdded(method.method_name));
  } catch (error) {
    await trx.rollback();
    console.error('Error adding method:', error);
    return res.status(500).json(messages.serverError);
  }
});

router.put('/methods', checkPermission('CanPOSTMethods'), async (req, res) => {
  const method = req.body;
  console.log(method);
  if (!method.method_name || !method.method_fk_acc_id || !method.method_id) {
    return res.status(400).json(messages.Error400);
  }
  const trx = await db.transaction();
  try {
    const existingMethod = await trx.select('*').from('co_methods').where('method_id', method.method_id).first();

    if (!existingMethod) {
      await trx.rollback();
      return res.status(404).json(messages.nonExistingMethod);
    }
    const duplicateMethod = await db
      .select('method_name')
      .from('co_methods')
      .where('method_name', method.method_name)
      .andWhere('method_fk_acc_id', method.method_fk_acc_id)
      .andWhere('method_id', '<>', method.method_id)
      .first();

    if (duplicateMethod) {
      await trx.rollback();
      return res.status(409).json(messages.existingMethod);
    }

    await trx('co_methods')
      .where('method_id', method.method_id)
      .update({
        method_name: method.method_name,
        method_fk_acc_id: method.method_fk_acc_id,
        method_is_valid: method.method_is_valid ? 1 : 0
      });

    await trx('au_activity_log').insert({
      log_fk_user_id: req.user.user_id,
      log_action: 'Méthode modifiée',
      log_details: `Méthode "${method.method_name}" modifiée par ${req.user.user_full_name}`
    });
    trx.commit();
    res.status(200).json(messages.methodModified(method.method_name));
  } catch (error) {
    console.error('Error updating method:', error);
    res.status(500).json(messages.serverError);
  }
});
router.get('/labtests', checkPermission('CanAccessCommercialApp'), async (req, res) => {
  try {
    const labtests = await db.select('*').from('labtests');
    res.status(200).json(labtests);
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});
router.get('/labtests/:id', checkPermission('CanAccessCommercialApp'), async (req, res) => {
  const id = req.params.id;
  try {
    const labtest = await db.select('*').from('co_labtests').where('labtest_id', id).first();
    res.status(200).json(labtest);
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});
router.post('/labtests', checkPermission('CanPOSTLabTests'), async (req, res) => {
  const labtest = req.body;

  if (!labtest.labtest_designation || !labtest.labtest_price || !labtest.labtest_fk_sector_id) {
    return res.status(400).json(messages.Error400);
  }

  if (isNaN(labtest.labtest_price) || labtest.labtest_price <= 0 || labtest.labtest_price > 1000000) {
    return res.status(400).json(messages.invalidPrice);
  }

  const trx = await db.transaction();
  try {
    const [method, sector] = await Promise.all([
      trx('co_methods').select('method_id').where('method_id', labtest.labtest_fk_method_id).first(),
      trx('co_sectors').select('sector_id').where('sector_id', labtest.labtest_fk_sector_id).first()
    ]);

    if (!method) {
      await trx.rollback();
      return res.status(400).json(messages.nonExistingMethod);
    }

    if (!sector) {
      await trx.rollback();
      return res.status(400).json(messages.nonExistingSector);
    }

    const existingLabtest = await trx('co_labtests')
      .select('labtest_designation')
      .where({
        labtest_designation: labtest.labtest_designation,
        labtest_fk_method_id: labtest.labtest_fk_method_id
      })
      .first();

    if (existingLabtest) {
      await trx.rollback();
      return res.status(409).json(messages.existingLabtest);
    }

    const nextLabtestFullId = await GetNextLabTestFullId();

    await trx('co_labtests').insert({
      labtest_full_id: nextLabtestFullId,
      labtest_designation: labtest.labtest_designation,
      labtest_fk_sector_id: labtest.labtest_fk_sector_id,
      labtest_price: labtest.labtest_price,
      labtest_fk_method_id: labtest.labtest_fk_method_id
    });

    await trx('au_activity_log').insert({
      log_fk_user_id: req.user.user_id,
      log_action: 'Essai ajouté',
      log_details: `Essai "${labtest.labtest_designation}" ajouté par ${req.user.user_full_name}`
    });

    await trx.commit();

    res.status(200).json(messages.labtestAdded(labtest.labtest_designation));
  } catch (error) {
    await trx.rollback();
    console.error('Error adding labtest:', error);
    res.status(500).json(messages.serverError);
  }
});

router.put('/labtests', checkPermission('CanPOSTLabTests'), async (req, res) => {
  const labtest = req.body;

  if (!labtest.labtest_id || !labtest.labtest_designation || !labtest.labtest_price || !labtest.labtest_fk_sector_id) {
    return res.status(400).json(messages.Error400);
  }

  if (isNaN(labtest.labtest_price) || labtest.labtest_price <= 0 || labtest.labtest_price > 1000000) {
    return res.status(400).json(messages.invalidPrice);
  }

  const trx = await db.transaction();
  try {
    const existingLabtest = await trx('co_labtests').select('labtest_id').where('labtest_id', labtest.labtest_id).first();

    if (!existingLabtest) {
      await trx.rollback();
      return res.status(404).json(messages.nonExistingLabtest);
    }

    const [method, sector] = await Promise.all([
      trx('co_methods').select('method_id').where('method_id', labtest.labtest_fk_method_id).first(),
      trx('co_sectors').select('sector_id').where('sector_id', labtest.labtest_fk_sector_id).first()
    ]);

    if (!method) {
      await trx.rollback();
      return res.status(400).json(messages.nonExistingMethod);
    }

    if (!sector) {
      await trx.rollback();
      return res.status(400).json(messages.nonExistingSector);
    }

    const duplicateLabtest = await trx('co_labtests')
      .select('labtest_id')
      .where({
        labtest_designation: labtest.labtest_designation,
        labtest_fk_method_id: labtest.labtest_fk_method_id
      })
      .andWhere('labtest_id', '!=', labtest.labtest_id)
      .first();

    if (duplicateLabtest) {
      await trx.rollback();
      return res.status(409).json(messages.existingLabtest);
    }

    await trx('co_labtests').where('labtest_id', labtest.labtest_id).update({
      labtest_designation: labtest.labtest_designation,
      labtest_fk_sector_id: labtest.labtest_fk_sector_id,
      labtest_price: labtest.labtest_price,
      labtest_fk_method_id: labtest.labtest_fk_method_id,
      labtest_is_valid: labtest.labtest_is_valid
    });

    await trx('au_activity_log').insert({
      log_fk_user_id: req.user.user_id,
      log_action: 'Essai mis à jour',
      log_details: `Essai "${labtest.labtest_designation}" mis à jour par ${req.user.user_full_name}`
    });

    await trx.commit();

    res.status(200).json(messages.labtestModified(labtest.labtest_designation));
  } catch (error) {
    await trx.rollback();
    console.error('Error updating labtest:', error);
    res.status(500).json(messages.serverError);
  }
});
router.get('/next-devis-id', async (req, res) => {
  try {
    const nextDevisFullId = await GetNextDevisFullId();
    res.status(200).json(nextDevisFullId);
  } catch (error) {
    console.error('Error getting next devis ID:', error);
    res.status(500).json(messages.serverError);
  }
});
router.get('/devis-pdf/:id', checkPermission('CanViewDevis'), async (req, res) => {
  const id = req.params.id;
  /*
   TODO: send proper devis pdf data, and refactor
   data to send only necessary fields:
    - devis_type
    - devis_formatted_id
    - devis_date
    - client_name
    - client_city
    - devis_object
    - devis_note
    - devis_currency
    - devis_forfait
    - devis_tax
    - conversion_rate
        - modality_name
    - totals: devis_total_ht, devis_total_ttc, devis_total_tva
    - elements: [
      - labtest_full_id
      - labtest_designation
      - element_note
      - method_name
      - acc_name
      - element_quantity
      - element_discount
      - element_price
      - element_total
    ] || [
    element_designation,
    element_quantity,
    element_discount,
    element_price,
    element_total 
    ]

   */
  try {
    const devis = await db('devis').select('*').where('devis_id', id).first();
    const devisType = devis.devis_type;
    const tableName = devisType === 'FF' ? 'co_ff_devis_elements' : 'co_st_devis_elements';
    const elements = await db(tableName).select('*').where('element_fk_devis_id', devis.devis_id);
    if (devis) {
      res.status(200).json({
        ...devis,
        elements
      });
    } else {
      res.status(404);
    }
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});

router.get('/devis/:filter', checkPermission('CanViewDevis'), async (req, res) => {
  const filter = req.params.filter || 'inprogress';
  const userPermissions = req.user.permissions;
  const statusFilter = {
    archived: [0, 0],
    inprogress: [1, 3],
    sent: [4, 7],
    accepted: [8, 9],
    all: [0, 9]
  };
  const permissionSorting = {
    CanValResp: 1,
    CanApprGen: 2,
    CanPOSTDevis: 3
  };
  if (!Object.hasOwn(statusFilter, filter)) {
    return res.status(400).json(messages.Error400);
  }
  const [statusMin, statusMax] = statusFilter[filter];
  try {
    let devisQuery = db('devis').whereBetween('devis_fk_status_id', [statusMin, statusMax]).orderBy('devis_id', 'desc');
    let devis = await devisQuery;
    res.status(200).json(devis);
  } catch (err) {
    console.error(err);
    res.status(500).json(messages.serverError);
  }
});
router.get('/devis-in/:id/:version', checkPermission('CanViewDevis'), async (req, res) => {
  const { id, version } = req.params;

  try {
    const devis = await db
      .select(
        'co_devis.*',
        db.raw(
          "CONCAT(co_devis.devis_full_id, IF(co_devis.devis_version > 0, CONCAT('.V', co_devis.devis_version), '')) as devis_formatted_id"
        ),
        db.raw("DATE_FORMAT(devis_date, '%d/%m/%Y') as devis_date"),
        db.raw("DATE_FORMAT(devis_timestamp, '%d/%m/%Y %H:%i:%s') as devis_timestamp"),
        db.raw("DATE_FORMAT(devis_sent_date, '%d/%m/%Y %H:%i:%s') as devis_sent_date"),
        'w_clients.*',
        'w_users.user_full_name',
        'w_types.type_name',
        'w_client_segment.segment_name',
        'es_files.es_file_full_id',
        'co_modalities.modality_name',
        'co_devis_statuses.*'
      )
      .from('co_devis')
      .leftJoin('co_devis_statuses', 'co_devis.devis_fk_status', 'co_devis_statuses.status_id')
      .leftJoin('w_clients', 'co_devis.devis_fk_client_id', 'w_clients.client_id')
      .leftJoin('es_files', 'co_devis.devis_fk_file_id', 'es_files.es_file_id')
      .leftJoin('w_users', 'co_devis.devis_fk_user_id', 'w_users.user_id')
      .leftJoin('w_types', 'co_devis.devis_fk_type_id', 'w_types.type_id')
      .leftJoin('w_client_segment', 'co_devis.devis_fk_segment_id', 'w_client_segment.segment_id')
      .leftJoin('co_modalities', 'co_devis.devis_fk_modality_id', 'co_modalities.modality_id')
      .where('co_devis.devis_full_id', id)
      .andWhere('co_devis.devis_version', version);

    if (devis.length === 0) {
      return res.status(404).json({
        title: 'Devis non trouvé',
        subtitle: "Le devis spécifié n'existe pas"
      });
    }

    const devisId = devis[0].devis_id;

    // Fetch type and responsible user information
    const type = await db('w_types').select('type_devis_fk_val_resp').where('type_id', devis[0].devis_fk_type_id);

    if (type.length > 0 && type[0].type_devis_fk_val_resp !== null) {
      const user = await db('w_users').select('user_id', 'user_full_name').where('user_role_id', type[0].type_devis_fk_val_resp);

      if (user.length > 0) {
        devis[0].devis_val_resp = user[0].user_id;
        devis[0].devis_val_resp_name = user[0].user_full_name;
      }
    }

    // Fetch required permission information
    const requiredPermission = await db
      .select('permission_name')
      .from('w_permissions')
      .join('co_devis_statuses', 'w_permissions.permission_id', 'co_devis_statuses.status_fk_permission_id')
      .where('status_id', devis[0].status_next_step);

    devis[0].requiredPermission = requiredPermission[0]?.permission_name;

    // Fetch elements if devis_type is "ST"
    if (devis[0].devis_type === 'ST') {
      const elements = await db
        .select(
          'co_e_devis_elements.*',
          'co_labtests.*',
          'co_methods.*',
          db.raw("CONCAT(co_e_devis_elements.element_discount, '%') as discount"),
          db.raw(
            'co_labtests.labtest_price * co_e_devis_elements.element_quantity * (1 - co_e_devis_elements.element_discount / 100) as total_price'
          )
        )
        .from('co_e_devis_elements')
        .leftJoin('co_labtests', 'co_e_devis_elements.element_test_id', 'co_labtests.labtest_id')
        .leftJoin('co_methods', 'co_labtests.labtest_fk_method_id', 'co_methods.method_id')
        .where('element_fk_devis_id', devisId)
        .orderBy('element_id', 'asc');

      devis[0].devis_elements = elements;
    } else if (devis[0].devis_type === 'FF') {
      const elements = await db
        .select(
          '*',
          db.raw("CONCAT(element_discount, '%') as discount"),
          db.raw('element_price * element_quantity * (1 - element_discount / 100) as total_price')
        )
        .from('co_ff_devis_elements')
        .where('element_fk_devis_id', devisId)
        .orderBy('element_id', 'asc');

      devis[0].devis_elements = elements;
    }

    const comments = await db
      .select(
        'co_devis_comments.*',
        db.raw("DATE_FORMAT(devis_comment_sent_time, '%d/%m/%Y %H:%i:%s') as comment_date"),
        'w_users.user_full_name',
        'w_users.user_profile_pic'
      )
      .from('co_devis_comments')
      .leftJoin('w_users', 'co_devis_comments.devis_comment_fk_user_id', 'user_id')
      .where('devis_comment_fk_devis_id', devisId)
      .orderBy('devis_comment_sent_time', 'desc');

    if (comments.length > 0) {
      const commentIds = comments.map((comment) => comment.devis_comment_id);
      const uploads = await db
        .select('upload_id', 'upload_file_name', 'upload_filesize', 'upload_filepath', 'upload_fk_comment_id')
        .from('co_devis_uploads')
        .whereIn('upload_fk_comment_id', commentIds);

      // Attach uploads to the corresponding comments
      comments.forEach((comment) => {
        comment.uploads = uploads.filter((upload) => upload.upload_fk_comment_id === comment.devis_comment_id);
      });
    }

    devis[0].devis_comments = comments;
    res.status(200).json(devis[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Erreur interne du serveur'
    });
  }
});
router.post('/add-devis/:type', checkPermission('CanPOSTDevis'), async (req, res) => {
  try {
    const { type } = req.params;
    const devis = req.body;
    const nextId = await GetNextDevisId();
    const devisType = devis.type_id;

    const typeData = await db('w_types').select('type_devis_fk_val_resp').where('type_id', devisType).first();

    let devis_status;
    let user;

    if (typeData.type_devis_fk_val_resp === null) {
      devis_status = 8;
    } else {
      user = await db('w_users').select('user_id', 'user_is_absent').where('user_role_id', typeData.type_devis_fk_val_resp).first();

      if (user && user.user_is_absent) {
        user = await db('w_users').select('user_id').where('user_role_id', 2).first();

        devis_status = 2;
      } else {
        devis_status = 1;
      }
    }

    const [devisId] = await db('co_devis').insert({
      devis_full_id: nextId,
      devis_date: devis.devis_date,
      devis_timestamp: new Date(),
      devis_object: devis.devis_object,
      devis_note: devis.devis_note,
      devis_tax: devis.tva,
      devis_currency: devis.currency,
      devis_total_ht: devis.total_ht,
      devis_total_ttc: devis.total_ttc,
      devis_forfait: devis.forfait,
      devis_fk_status: devis_status,
      devis_fk_client_id: devis.client_id,
      devis_fk_segment_id: devis.segment_id,
      devis_fk_type_id: devis.type_id,
      devis_fk_user_id: req.user.user_id,
      devis_fk_modality_id: devis.modality_id,
      devis_type: type == 'ff' ? 'FF' : 'ST'
    });

    let insertElements;
    if (type === 'st') {
      insertElements = devis.tests.map((element) => ({
        element_test_id: element.designation,
        element_note: element.note,
        element_quantity: element.quantity,
        element_discount: element.discount,
        element_fk_devis_id: devisId
      }));
      await db('co_e_devis_elements').insert(insertElements);
    } else if (type === 'ff') {
      insertElements = devis.tests.map((element) => ({
        element_designation: element.designation,
        element_quantity: element.quantity,
        element_discount: element.discount,
        element_price: element.price,
        element_fk_devis_id: devisId
      }));
      await db('co_ff_devis_elements').insert(insertElements);
    } else {
      return res.status(400).json({
        error: 'Type de devis invalide',
        message: "Le type de devis spécifié n'est pas valide."
      });
    }

    await db('co_devis_comments').insert({
      devis_comment_fk_devis_id: devisId,
      devis_comment_title: 'Devis créé',
      devis_comment_content: `Le devis ${nextId} a été créé par ${req.user.user_full_name}`,
      devis_comment_sent_time: new Date(),
      devis_comment_fk_user_id: req.user.user_id
    });

    await db('w_activity_log').insert({
      user_id: req.user.user_id,
      action: 'Devis ajouté',
      details: `Devis ${nextId} added by ${req.user.user_full_name}`,
      timestamp: new Date()
    });

    if (user) {
      const title = 'Nouveau devis';
      const notification = `${req.user.user_full_name} vous a envoyé un nouveau devis "${nextId}" pour validation. Visitez la page du suivi devis pour le consulter.`;
      const link = `/devis/${nextId}/0`;
      sendNotificationAndEmail(user.user_id, title, notification, link, nextId);
    }

    res.status(200).json({
      success: 'Devis ajouté avec succès',
      message: `Le devis "${nextId}" a été ajouté avec succès.`
    });
  } catch (err) {
    res.status(500).json({
      error: "Erreur lors de l'ajout du devis",
      message: "Erreur interne, Contactez l'administrateur"
    });
    console.error(err);
  }
});
router.put('/modify-devis/:type', checkPermission('CanPOSTDevis'), async (req, res) => {
  try {
    const { type } = req.params;
    const devis = req.body;
    const devisId = devis.devis_id;

    const devisDetails = await db('co_devis').select('*').where('devis_id', devisId);
    if (devisDetails.length === 0) {
      return res.status(404).json({ error: 'Devis non trouvé' });
    }

    const devisStatus = devisDetails[0].devis_fk_status;
    const oldDevisFormattedId =
      devisDetails[0].devis_full_id + (devisDetails[0].devis_version > 0 ? '.V' + devisDetails[0].devis_version : '');

    if (devisStatus === 0 || devisStatus === 10) {
      return res.status(403).json({ error: 'Modification non autorisée' });
    }

    if (devis.new) {
      await db('co_devis').where('devis_id', devisId).update({
        devis_fk_status: 0
      });

      await db('co_devis_comments').insert({
        devis_comment_fk_devis_id: devisId,
        devis_comment_title: 'Devis archivé',
        devis_comment_content: `Le devis ${oldDevisFormattedId} a été archivé par ${req.user.user_full_name}`,
        devis_comment_sent_time: new Date(),
        devis_comment_status: 4,
        devis_comment_fk_user_id: req.user.user_id
      });

      const [newDevisId] = await db('co_devis').insert({
        devis_full_id: devisDetails[0].devis_full_id,
        devis_version: devisDetails[0].devis_version + 1,
        devis_date: devis.devis_date,
        devis_timestamp: new Date(),
        devis_object: devis.object,
        devis_note: devis.devis_note,
        devis_tax: devis.tva,
        devis_currency: devis.currency,
        devis_total_ht: devis.total_ht,
        devis_total_ttc: devis.total_ttc,
        devis_forfait: devis.forfait,
        devis_fk_status: 1,
        devis_fk_client_id: devis.client_id,
        devis_fk_segment_id: devis.segment_id,
        devis_fk_type_id: devis.type_id,
        devis_fk_user_id: req.user.user_id,
        devis_fk_modality_id: devis.modality_id,
        devis_type: type === 'ff' ? 'FF' : 'ST'
      });

      if (type === 'st') {
        const insertElements = devis.tests.map((element) => ({
          element_test_id: element.designation,
          element_note: element.note,
          element_quantity: element.quantity,
          element_discount: element.discount,
          element_fk_devis_id: newDevisId
        }));
        await db('co_e_devis_elements').insert(insertElements);
      } else if (type === 'ff') {
        const insertElements = devis.tests.map((element) => ({
          element_designation: element.designation,
          element_quantity: element.quantity,
          element_discount: element.discount,
          element_price: element.price,
          element_fk_devis_id: newDevisId
        }));
        await db('co_ff_devis_elements').insert(insertElements);
      }

      await db('co_devis_comments').insert({
        devis_comment_fk_devis_id: newDevisId,
        devis_comment_title: 'Devis créé',
        devis_comment_content: `Le devis ${devisDetails[0].devis_full_id}.V${
          devisDetails[0].devis_version + 1
        } a été créé par ${req.user.user_full_name}`,
        devis_comment_sent_time: new Date(),
        devis_comment_fk_user_id: req.user.user_id
      });

      const devisType = await db('w_types').select('type_devis_fk_val_resp').where('type_id', devis.type_id);
      if (devisType[0].type_devis_fk_val_resp !== null) {
        const user = await db('w_users').select('user_id').where('user_role_id', devisType[0].type_devis_fk_val_resp);
        const title = 'Nouveau devis';
        const notification = `${req.user.user_full_name} vous a envoyé un nouveau devis "${devisDetails[0].devis_full_id}.V${
          devisDetails[0].devis_version + 1
        }". Visitez la page du suivi devis pour le consulter.`;
        const link = `/devis/${devisDetails[0].devis_full_id}/${devisDetails[0].devis_version + 1}`;
        sendNotificationAndEmail(
          user[0].user_id,
          title,
          notification,
          link,
          `${devisDetails[0].devis_full_id}.V${devisDetails[0].devis_version + 1}`
        );
      }

      res.status(200).json({
        success: 'Devis modifié avec succès',
        message: `Le devis "${devisDetails[0].devis_full_id}.V${
          devisDetails[0].devis_version + 1
        }" a été ajouté avec succès, et le devis "${oldDevisFormattedId}" a été archivé.`
      });
    } else {
      await db('co_devis').where('devis_id', devisId).update({
        devis_date: devis.devis_date,
        devis_timestamp: new Date(),
        devis_object: devis.object,
        devis_note: devis.note,
        devis_tax: devis.tva,
        devis_currency: devis.currency,
        devis_total_ht: devis.total_ht,
        devis_total_ttc: devis.total_ttc,
        devis_forfait: devis.forfait,
        devis_fk_status: devisStatus,
        devis_fk_client_id: devis.client_id,
        devis_fk_segment_id: devis.segment_id,
        devis_fk_type_id: devis.type_id,
        devis_fk_user_id: req.user.user_id,
        devis_fk_modality_id: devis.modality_id,
        devis_error: 0
      });

      if (type === 'st') {
        await db('co_e_devis_elements').where('element_fk_devis_id', devisId).del();
        const insertElements = devis.tests.map((element) => ({
          element_test_id: element.designation,
          element_note: element.note,
          element_quantity: element.quantity,
          element_discount: element.discount,
          element_fk_devis_id: devisId
        }));
        await db('co_e_devis_elements').insert(insertElements);
      } else if (type === 'ff') {
        await db('co_ff_devis_elements').where('element_fk_devis_id', devisId).del();
        const insertElements = devis.tests.map((element) => ({
          element_designation: element.designation,
          element_quantity: element.quantity,
          element_discount: element.discount,
          element_price: element.price,
          element_fk_devis_id: devisId
        }));
        await db('co_ff_devis_elements').insert(insertElements);
      }

      await db('co_devis_comments').insert({
        devis_comment_fk_devis_id: devisDetails[0].devis_id,
        devis_comment_title: 'Devis modifié',
        devis_comment_content: `Le devis ${oldDevisFormattedId} a été modifié par ${req.user.user_full_name}`,
        devis_comment_sent_time: new Date(),
        devis_comment_status: 4,
        devis_comment_fk_user_id: req.user.user_id
      });

      await db('w_activity_log').insert({
        user_id: req.user.user_id,
        action: 'Devis modified',
        details: `Devis ${oldDevisFormattedId} modifié par ${req.user.user_full_name}`,
        timestamp: new Date()
      });

      if (devisStatus >= 1 && devisStatus <= 3) {
        const nextStep = await db('co_devis_statuses').select('status_next_step', 'status_long_name').where('status_id', devisStatus);
        const requiredPermission = await db
          .select('permission_name', 'permission_id')
          .from('w_permissions')
          .join('co_devis_statuses', 'w_permissions.permission_id', 'co_devis_statuses.status_fk_permission_id')
          .where('status_id', nextStep[0].status_next_step || 0);

        const nextStepUser =
          devisStatus === 1
            ? await db('w_users')
                .select('user_id')
                .join('w_types', 'w_users.user_role_id', 'w_types.type_devis_fk_val_resp')
                .where('type_id', devis.type_id)
            : await db('w_users')
                .select('user_id')
                .join('w_rp_mapping', 'w_users.user_role_id', 'w_rp_mapping.rp_role_id')
                .where('w_rp_mapping.rp_permission_id', requiredPermission[0]?.permission_id || 0);

        const title = 'Devis modifié';
        const notification = `${req.user.user_full_name} a modifié le devis "${oldDevisFormattedId}" . Visitez la page du suivi devis pour le consulter.`;
        const link = `/devis/${devisDetails[0].devis_full_id}/${devisDetails[0].devis_version}`;
        if (nextStepUser[0]?.user_id) {
          sendNotificationAndEmail(nextStepUser[0]?.user_id, title, notification, link, oldDevisFormattedId);
        }
      }

      res.status(200).json({
        success: 'Devis modifié avec succès',
        message: `Le devis "${oldDevisFormattedId}" a été modifié avec succès.`
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Erreur lors de la modification du devis',
      message: "Erreur interne, Contactez l'administrateur"
    });
  }
});
//Accept
function formatDevisId(devis) {
  return `${devis.devis_full_id}${devis.devis_version !== 0 ? '.V' + devis.devis_version : ''}`;
}

async function logActivity(trx, userId, action, details) {
  await trx('w_activity_log').insert({
    user_id: userId,
    action: action,
    details: details,
    timestamp: new Date()
  });
}

async function getNextStep(trx, statusId) {
  return trx('co_devis_statuses').select('status_next_step', 'status_long_name').where('status_id', statusId).first();
}

async function getNextStepUser(trx, statusId) {
  const nextStepPermission = await trx
    .select('permission_id')
    .from('w_permissions')
    .join('co_devis_statuses', 'w_permissions.permission_id', 'co_devis_statuses.status_fk_permission_id')
    .where('status_id', statusId)
    .first();

  return trx('w_users')
    .select('user_id')
    .join('w_rp_mapping', 'w_users.user_role_id', 'w_rp_mapping.rp_role_id')
    .where('rp_permission_id', nextStepPermission?.permission_id || 0)
    .first();
}

async function insertComment(trx, { title, content, status, userId, devisId }) {
  await trx('co_devis_comments').insert({
    devis_comment_title: title,
    devis_comment_content: content,
    devis_comment_sent_time: new Date(),
    devis_comment_status: status,
    devis_comment_fk_user_id: userId,
    devis_comment_fk_devis_id: devisId
  });
}
router.post('/devis/validate', async (req, res) => {
  const { devis_id, decision, comment, mentionedUsers } = req.body;
  const userId = req.user.user_id;
  const userFullName = req.user.user_full_name;
  try {
    const devisDetails = await db('co_devis')
      .select('co_devis.*', 'w_clients.client_name', 'co_devis_statuses.status_next_step')
      .leftJoin('w_clients', 'co_devis.devis_fk_client_id', 'w_clients.client_id')
      .leftJoin('co_devis_statuses', 'co_devis.devis_fk_status', 'co_devis_statuses.status_id')
      .where('devis_id', devis_id)
      .first();

    if (!devisDetails) {
      return res.status(404).json({ error: 'Devis not found' });
    }

    const requiredPermission = await db('w_permissions')
      .select('permission_name')
      .join('co_devis_statuses', 'w_permissions.permission_id', 'co_devis_statuses.status_fk_permission_id')
      .where('status_id', devisDetails.status_next_step)
      .first();

    if (!req.user.permissions.includes(requiredPermission.permission_name)) {
      return res.status(403).json({
        error: 'Permission non accordée',
        message: "Vous n'avez pas la permission d'effectuer cette action"
      });
    }

    await db.transaction(async (trx) => {
      if (decision === 'accept') {
        await trx('co_devis').where('devis_id', devis_id).update({
          devis_fk_status: devisDetails.status_next_step,
          devis_error: 0
        });

        await logActivity(trx, userId, 'Devis accepté', `Devis ${formatDevisId(devisDetails)} accepté par ${userFullName}`);

        const nextStep = await getNextStep(trx, devisDetails.status_next_step);
        const nextStepUser = await getNextStepUser(trx, nextStep.status_next_step);

        const title = 'Devis accepté';
        const notification = `${userFullName} a accepté le devis "${formatDevisId(devisDetails)}" pour le client ${
          devisDetails.client_name
        }. Visitez la page du suivi devis pour le consulter.`;
        const link = `/devis/${devisDetails.devis_full_id}/${devisDetails.devis_version}`;

        sendNotificationAndEmail(devisDetails.devis_fk_user_id, title, notification, link, formatDevisId(devisDetails));
        if (nextStepUser?.user_id) {
          sendNotificationAndEmail(nextStepUser.user_id, title, notification, link, formatDevisId(devisDetails));
        }
        for (const username of mentionedUsers) {
          const mentionedUser = await db('w_users').select('user_id').where('user_username', username).first();

          if (mentionedUser) {
            sendNotificationAndEmail(
              mentionedUser.user_id,
              'Commentaire Mentionné',
              `${userFullName} vous a mentionné dans un commentaire du devis "${formatDevisId(devisDetails)}" pour le client ${
                devisDetails.client_name
              }. Visitez la page du suivi devis pour le consulter.`,
              link,
              formatDevisId(devisDetails)
            );
          }
        }
        await insertComment(trx, {
          title: nextStep.status_long_name,
          content: comment || `Le devis ${formatDevisId(devisDetails)} a reçu la ${nextStep.status_long_name} par ${userFullName}`,
          status: 3,
          userId,
          devisId: devis_id
        });

        res.status(200).json({
          title: 'Devis accepté avec succès',
          subtitle: `Le devis "${formatDevisId(devisDetails)}" a été accepté avec succès.`
        });
      } else if (decision === 'refuse') {
        await trx('co_devis').where('devis_id', devis_id).update({
          devis_error: 1
        });

        await logActivity(trx, userId, 'Devis refusé', `Devis ${formatDevisId(devisDetails)} refusé par ${userFullName}`);

        const title = 'Devis refusé';
        const notification = `${userFullName} a refusé le devis "${formatDevisId(devisDetails)}" pour le client ${
          devisDetails.client_name
        }. Visitez la page du suivi devis pour le consulter.`;
        const link = `/devis/${devisDetails.devis_full_id}/${devisDetails.devis_version}`;

        sendNotificationAndEmail(devisDetails.devis_fk_user_id, title, notification, link, formatDevisId(devisDetails));

        await insertComment(trx, {
          title: 'Devis refusé',
          content: comment,
          status: 2,
          userId,
          devisId: devis_id
        });
        for (const username of mentionedUsers) {
          const mentionedUser = await db('w_users').select('user_id').where('user_username', username).first();

          if (mentionedUser) {
            sendNotificationAndEmail(
              mentionedUser.user_id,
              'Commentaire Mentionné',
              `${userFullName} vous a mentionné dans un commentaire du devis "${formatDevisId(devisDetails)}" pour le client ${
                devisDetails.client_name
              }. Visitez la page du suivi devis pour le consulter.`,
              link,
              formatDevisId(devisDetails)
            );
          }
        }
        res.status(200).json({
          title: 'Devis refusé avec succès',
          subtitle: `Le devis "${formatDevisId(devisDetails)}" a été refusé avec succès.`
        });
      } else {
        res.status(400).json({
          title: 'Erreur lors de la validation du devis',
          subtitle: 'Décision invalide'
        });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      title: 'Erreur lors de la validation du devis',
      subtitle: "Erreur interne, Contactez l'administrateur"
    });
  }
});
router.post('/devis/comment', checkPermission('CanViewDevis'), upload.array('attachments'), async (req, res) => {
  try {
    const { body, files, user } = req;
    let { devis_id, comment, mentionedUsers } = body;

    if (typeof mentionedUsers === 'string') {
      mentionedUsers = JSON.parse(mentionedUsers);
    }

    await db('co_devis_comments').insert({
      devis_comment_content: comment,
      devis_comment_sent_time: new Date(),
      devis_comment_status: 1,
      devis_comment_fk_user_id: user.user_id,
      devis_comment_fk_devis_id: devis_id
    });

    const [commentEntry] = await db('co_devis_comments')
      .select('devis_comment_id')
      .where({
        devis_comment_fk_user_id: user.user_id,
        devis_comment_fk_devis_id: devis_id
      })
      .orderBy('devis_comment_sent_time', 'desc')
      .limit(1);

    const commentId = commentEntry.devis_comment_id;

    if (files && files.length > 0) {
      const uploadPromises = files.map(async (file) => {
        const uploadFilePath = file.path.replace(/\\/g, '/');
        await db('co_devis_uploads').insert({
          upload_file_name: file.originalname,
          upload_filesize: file.size,
          upload_filepath: uploadFilePath.startsWith('/') ? uploadFilePath : `/${uploadFilePath}`,
          upload_fk_comment_id: commentId
        });
      });

      await Promise.all(uploadPromises);
    }

    const devisDetails = await db('co_devis')
      .select('co_devis.*', 'w_clients.client_name')
      .leftJoin('w_clients', 'co_devis.devis_fk_client_id', 'w_clients.client_id')
      .where('devis_id', devis_id)
      .first();

    if (mentionedUsers && mentionedUsers.length > 0) {
      const link = `/devis/${devisDetails.devis_full_id}/${devisDetails.devis_version}`;
      for (const username of mentionedUsers) {
        const mentionedUser = await db('w_users').select('user_id').where('user_username', username).first();

        if (mentionedUser) {
          sendNotificationAndEmail(
            mentionedUser.user_id,
            'Commentaire Mentionné',
            `${user.user_full_name} vous a mentionné dans un commentaire du devis "${formatDevisId(devisDetails)}" pour le client ${
              devisDetails.client_name
            }. Visitez la page du suivi devis pour le consulter.`,
            link,
            formatDevisId(devisDetails)
          );
        }
      }
    }

    res.status(200).json({ message: 'Comment and files uploaded successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
router.get('/download-comment-files/:devis_comment_id', async (req, res) => {
  try {
    const { devis_comment_id } = req.params;
    const uploads = await db('co_devis_uploads')
      .select('upload_file_name', 'upload_filepath')
      .where('upload_fk_comment_id', devis_comment_id);

    if (!uploads || uploads.length === 0) {
      return res.status(404).json({ error: 'No uploads found for the provided comment ID' });
    }
    const zip = new JSZip();
    uploads.forEach((upload) => {
      const filePath = path.join(__dirname, '..', upload.upload_filepath);
      const fileContent = fs.readFileSync(filePath);
      zip.file(upload.upload_file_name, fileContent);
    });
    const zipBlob = await zip.generateAsync({ type: 'nodebuffer' });
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="fichiers.zip"`
    });
    res.status(200).send(zipBlob);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
router.post('/devis/send', checkPermission('CanSendDevis'), async (req, res) => {
  try {
    const { devis_id } = req.body;
    const userId = req.user.user_id;
    const userFullName = req.user.user_full_name;
    const devisDetails = await db('co_devis').select('*').where('devis_id', devis_id).first();

    if (!devisDetails) {
      return res.status(404).json({ error: 'Devis not found' });
    }
    if (devisDetails.devis_fk_status !== 3) {
      return res.status(403).json({
        error: 'Invalid Devis Status',
        message: 'Le devis doit avoir le statut 3 pour être envoyé.'
      });
    }
    await db('co_devis')
      .update({
        devis_fk_status: 4,
        devis_sent_date: new Date()
      })
      .where('devis_id', devis_id);
    await db('co_devis_comments').insert({
      devis_comment_fk_devis_id: devis_id,
      devis_comment_title: 'Devis envoyé',
      devis_comment_content: `Le devis ${formatDevisId(devisDetails)} a été envoyé au client par ${userFullName}`,
      devis_comment_status: 5,
      devis_comment_sent_time: new Date(),
      devis_comment_fk_user_id: userId
    });
    await db('w_activity_log').insert({
      user_id: userId,
      action: 'Devis envoyP',
      details: `Devis ${formatDevisId(devisDetails)} marqué comme envoyé au client par ${userFullName}`,
      timestamp: new Date()
    });
    res.status(200).json({
      success: 'Devis envoyé avec succès',
      message: `Le devis "${formatDevisId(devisDetails)}" a été envoyé avec succès.`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Erreur lors de l'envoi du devis",
      message: "Erreur interne, Contactez l'administrateur"
    });
  }
});
router.post('/devis/archive', checkPermission('CanSendDevis'), async (req, res) => {
  const { devis_id } = req.body;
  const userId = req.user.user_id;
  const userFullName = req.user.user_full_name;

  try {
    // Check if the devis exists and fetch its details
    const devisDetails = await db('co_devis').select('*').where('devis_id', devis_id).first();

    if (!devisDetails) {
      return res.status(404).json({ error: 'Devis not found' });
    }

    if (devisDetails.devis_fk_status >= 8) {
      return res.status(403).json({
        error: 'Devis cannot be archived',
        message: 'Only devis with a status less than 8 can be archived'
      });
    }

    await db.transaction(async (trx) => {
      await trx('co_devis').where('devis_id', devis_id).update({ devis_fk_status: 0, devis_error: 0 });

      await trx('co_devis_comments').insert({
        devis_comment_fk_devis_id: devis_id,
        devis_comment_title: 'Devis archivé',
        devis_comment_content: `Le devis ${formatDevisId(devisDetails)} a été archivé par ${userFullName}`,
        devis_comment_status: 0,
        devis_comment_sent_time: new Date(),
        devis_comment_fk_user_id: userId
      });

      await trx('w_activity_log').insert({
        user_id: userId,
        action: 'Devis archivé',
        details: `Devis ${formatDevisId(devisDetails)} archivé by ${userFullName}`,
        timestamp: new Date()
      });
    });

    res.status(200).json({
      success: 'Devis archivé avec succès',
      message: `Le devis "${formatDevisId(devisDetails)}" a été archivé avec succès.`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Erreur lors de l'archivage du devis",
      message: "Erreur interne, Contactez l'administrateur"
    });
  }
});

router.get('/purchases', checkPermission('CanViewDevis'), async (_, res) => {
  try {
    const purchases = await db.select('*').from('purchases');
    res.status(200).json(purchases);
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});
router.get('/devis-client/:id', async (req, res) => {
  try {
    const devis = await db
      .select(
        'devis_id',
        'devis_full_id',
        'devis_version',
        db.raw(
          "CONCAT(co_devis.devis_full_id, IF(co_devis.devis_version > 0, CONCAT('.V', co_devis.devis_version), '')) as devis_formatted_id"
        ),
        'devis_object'
      )
      .from('co_devis')
      .where('devis_fk_client_id', req.params.id)
      .andWhere('devis_fk_status', '!=', 9)
      .orderBy('devis_id', 'desc');
    res.status(200).json(devis);
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});
router.post('/purchases', checkPermission('CanPOSTDevis'), async (req, res) => {
  try {
    const purchase = req.body;
    const devisId = purchase.devis_id;
    const devisDetails = await db('co_devis').select('*').where('devis_id', devisId);
    if (devisDetails.length === 0) {
      return res.status(404).json({
        error: 'Devis non trouvé',
        description: "Le devis spécifié n'existe pas"
      });
    }
    if (devisDetails[0].devis_fk_status === 9) {
      return res.status(403).json({
        error: 'Devis facturé',
        description: 'Le devis spécifié est déjà facturé'
      });
    }
    const purchaseExists = await db('co_purchases')
      .select('*')
      .where('purchase_fk_devis_id', devisId)
      .andWhere('purchase_fk_client_id', purchase.client_id);
    if (purchaseExists.length > 0) {
      return res.status(409).json({
        error: 'Bon de commande déjà existant',
        description: `Un bon de commande pour ce devis et ce client existe déjà.`
      });
    }
    const nextId = await GetNextPurchaseOrderId();
    const insertPurchase = db('co_purchases').insert({
      purchase_full_id: nextId,
      purchase_order_ref: purchase.order_ref,
      purchase_designation: purchase.designation,
      purchase_date: purchase.purchase_date,
      purchase_fk_devis_id: devisId,
      purchase_fk_client_id: purchase.client_id
    });
    await insertPurchase;
    await db('co_devis').where('devis_id', devisId).update({
      devis_fk_status: 8
    });
    await db('co_devis_comments').insert({
      devis_comment_fk_devis_id: devisId,
      devis_comment_title: 'Bon de commande créé',
      devis_comment_content: `Le bon de commande ${nextId} a été créé par ${req.user.user_full_name}`,
      devis_comment_sent_time: new Date(),
      devis_comment_fk_user_id: req.user.user_id
    });
    await db('w_activity_log').insert({
      user_id: req.user.user_id,
      action: 'Bon de commande ajouté',
      details: `Bon de commande "${nextId}" ajouté par ${req.user.user_full_name}`,
      timestamp: new Date()
    });
    res.status(200).json({
      success: 'Bon de commande ajouté avec succès',
      description: `Le bon de commande "${nextId}" a été ajouté avec succès.`
    });
  } catch (err) {
    res.status(500).json({
      error: "Erreur lors de l'ajout du bon de commande",
      description: "Erreur interne, Contactez l'administrateur"
    });
    console.log(err);
  }
});
router.put('/purchases', checkPermission('CanPOSTDevis'), async (req, res) => {
  try {
    const purchase = req.body;
    const purchaseId = purchase.purchase_id;
    const purchaseDetails = await db('co_purchases').select('*').where('purchase_id', purchaseId);
    if (purchaseDetails.length === 0) {
      return res.status(404).json({
        error: 'Bon de commande non trouvé',
        description: "Le bon de commande spécifié n'existe pas"
      });
    }
    const devisId = purchaseDetails[0].purchase_fk_devis_id;
    const devisDetails = await db('co_devis').select('*').where('devis_id', devisId);
    if (devisDetails.length === 0) {
      return res.status(404).json({
        error: 'Devis non trouvé',
        description: "Le devis spécifié n'existe pas"
      });
    }
    const devisStatus = devisDetails[0].devis_fk_status;
    if (devisStatus < 5) {
      return res.status(403).json({
        error: 'Permission non accordée',
        description: "Vous n'avez pas la permission d'effectuer cette action"
      });
    }
    if (devisStatus === 9) {
      return res.status(403).json({
        error: 'Devis facturé',
        description: 'Le devis spécifié est déjà facturé'
      });
    }
    await db('co_purchases').where('purchase_id', purchaseId).update({
      purchase_fk_client_id: purchase.client_id,
      purchase_fk_devis_id: purchase.devis_id,
      purchase_order_ref: purchase.order_ref,
      purchase_designation: purchase.designation,
      purchase_date: purchase.purchase_date
    });
    await db('w_activity_log').insert({
      user_id: req.user.user_id,
      action: 'Bon de commande modifié',
      details: `Bon de commande "${purchaseDetails[0].purchase_full_id}" modifié par ${req.user.user_full_name}`,
      timestamp: new Date()
    });
    res.status(200).json({
      success: 'Bon de commande modifié avec succès',
      description: `Le bon de commande "${purchaseDetails[0].purchase_full_id}" a été modifié avec succès.`
    });
  } catch (err) {
    res.status(500).json({
      error: 'Erreur lors de la modification du bon de commande',
      description: "Erreur interne, Contactez l'administrateur"
    });
    console.log(err);
  }
});
router.get('/next-invoice-id', async (req, res) => {
  const date = req.query.date ? new Date(req.query.date) : new Date();
  try {
    const nextId = await GetNextInvoiceFullId(date);
    res.status(200).json(nextId);
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});

router.get('/invoices', checkPermission('CanViewInvoices'), async (req, res) => {
  try {
    const invoices = await db
      .distinct(
        'co_invoices.*',
        db.raw("DATE_FORMAT(invoice_date, '%d/%m/%Y') as invoice_date"),
        'w_clients.client_id',
        'w_clients.client_name',
        'es_files.es_file_full_id',
        'co_devis.devis_id',
        'co_devis.devis_full_id',
        'co_devis.devis_version',
        'es_files.es_file_full_id',
        'co_purchases.purchase_order_ref',
        db.raw("DATE_FORMAT(purchase_date, '%d/%m/%Y') as purchase_date"),
        db.raw(
          "CONCAT(co_devis.devis_full_id, IF(co_devis.devis_version > 0, CONCAT('.V', co_devis.devis_version), '')) as devis_formatted_id"
        ),
        'co_devis.devis_total_ht',
        'co_devis.devis_total_ttc',
        'w_client_segment.segment_name',
        'w_types.type_name',
        'co_modalities.modality_name',
        'co_invoice_norms.norm_name',
        'w_users.user_full_name'
      )
      .from('co_devis')
      .leftJoin('w_clients', 'co_devis.devis_fk_client_id', 'client_id')
      .leftJoin('es_files', 'co_devis.devis_fk_file_id', 'es_file_id')
      .leftJoin('co_purchases', 'co_purchases.purchase_fk_devis_id', 'devis_id')
      .join('co_invoices', 'co_devis.devis_id', 'invoice_fk_devis_id')
      .leftJoin('co_modalities', 'co_devis.devis_fk_modality_id', 'co_modalities.modality_id')
      .leftJoin('w_types', 'co_devis.devis_fk_type_id', 'w_types.type_id')
      .leftJoin('w_client_segment', 'co_devis.devis_fk_segment_id', 'w_client_segment.segment_id')
      .leftJoin('w_users', 'co_invoices.invoice_fk_user_id', 'user_id')
      .leftJoin('co_invoice_norms', 'co_invoices.invoice_fk_norm_id', 'co_invoice_norms.norm_id')
      .orderBy('invoice_id', 'desc');

    res.status(200).json(invoices);
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});
router.get('/invoice/:id', checkPermission('CanViewInvoices'), async (req, res) => {
  const { id } = req.params;

  try {
    const invoices = await db
      .distinct(
        'co_invoices.*',
        db.raw("DATE_FORMAT(invoice_date, '%d/%m/%Y') as invoice_date"),
        'w_clients.*',
        'es_files.es_file_full_id',
        'co_devis.*',
        'co_purchases.purchase_order_ref',
        db.raw("DATE_FORMAT(purchase_date, '%d/%m/%Y') as purchase_date"),
        db.raw(
          "CONCAT(co_devis.devis_full_id, IF(co_devis.devis_version > 0, CONCAT('.V', co_devis.devis_version), '')) as devis_formatted_id"
        ),
        'co_devis.devis_total_ht',
        'co_devis.devis_total_ttc',
        'w_client_segment.segment_name',
        'w_types.type_name',
        'co_modalities.modality_name',
        'co_invoice_norms.norm_name',
        'w_users.user_full_name'
      )
      .from('co_devis')
      .leftJoin('w_clients', 'co_devis.devis_fk_client_id', 'client_id')
      .leftJoin('es_files', 'co_devis.devis_fk_file_id', 'es_file_id')
      .leftJoin('co_purchases', 'co_purchases.purchase_fk_devis_id', 'devis_id')
      .join('co_invoices', 'co_devis.devis_id', 'invoice_fk_devis_id')
      .leftJoin('co_modalities', 'co_devis.devis_fk_modality_id', 'co_modalities.modality_id')
      .leftJoin('w_types', 'co_devis.devis_fk_type_id', 'w_types.type_id')
      .leftJoin('w_client_segment', 'co_devis.devis_fk_segment_id', 'w_client_segment.segment_id')
      .leftJoin('w_users', 'co_invoices.invoice_fk_user_id', 'user_id')
      .leftJoin('co_invoice_norms', 'co_invoices.invoice_fk_norm_id', 'co_invoice_norms.norm_id')
      .where('invoice_full_id', id);

    if (invoices.length === 0) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    const invoice = invoices[0];
    const devisId = invoice.devis_id;

    if (invoice.devis_type === 'ST') {
      const elements = await db
        .select(
          'co_e_devis_elements.*',
          'co_labtests.*',
          'co_methods.*',
          db.raw("CONCAT(co_e_devis_elements.element_discount, '%') as discount"),
          db.raw(
            'co_labtests.labtest_price * co_e_devis_elements.element_quantity * (1 - co_e_devis_elements.element_discount / 100) as total_price'
          )
        )
        .from('co_e_devis_elements')
        .leftJoin('co_labtests', 'co_e_devis_elements.element_test_id', 'co_labtests.labtest_id')
        .leftJoin('co_methods', 'co_labtests.labtest_fk_method_id', 'co_methods.method_id')
        .where('element_fk_devis_id', devisId)
        .orderBy('element_id', 'asc');

      invoice.devis_elements = elements;
    } else if (invoice.devis_type === 'FF') {
      const elements = await db
        .select(
          '*',
          db.raw("CONCAT(element_discount, '%') as discount"),
          db.raw('element_price * element_quantity * (1 - element_discount / 100) as total_price')
        )
        .from('co_ff_devis_elements')
        .where('element_fk_devis_id', devisId)
        .orderBy('element_id', 'asc');

      invoice.devis_elements = elements;
    }
    res.status(200).json(invoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Erreur interne du serveur'
    });
  }
});
router.get('/invoice-norms', async (req, res) => {
  try {
    const norms = await db('co_invoice_norms').select('*').orderBy('norm_name');
    res.status(200).json(norms);
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});
//Add New Norm
router.post('/invoice-norms', checkPermission('CanPOSTInvoices'), async (req, res) => {
  const trx = await db.transaction();
  try {
    const norm_name = req.body.norm_name;
    const normExists = await trx('co_invoice_norms').select('*').where('norm_name', norm_name);
    if (normExists.length > 0) {
      await trx.rollback();
      return res.status(409).json({
        error: 'Norme déjà existante',
        description: `La norme "${norm_name}" existe déjà.`
      });
    }
    await trx('co_invoice_norms').insert({ norm_name });
    await trx('w_activity_log').insert({
      user_id: req.user.user_id,
      action: 'Norm added',
      details: `Norm ${norm_name} added by ${req.user.user_full_name}`,
      timestamp: new Date()
    });
    await trx.commit();
    res.status(200).json({
      success: 'Norme ajoutée avec succès',
      description: `La norme "${norm_name}" a été ajoutée avec succès.`
    });
  } catch (err) {
    await trx.rollback();
    res.status(500).json({
      error: "Erreur lors de l'ajout de la norme",
      description: "Erreur interne, Contactez l'administrateur"
    });
    console.log(err);
  }
});
router.get('/devis-options/:id', async (req, res) => {
  try {
    const devis = await db('co_devis').select('*').from('invoice_info').where('devis_fk_client_id', req.params.id);
    res.status(200).json(devis);
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});
router.get('/devis-details/:id', checkPermission('CanViewDevis'), async (req, res) => {
  const { id } = req.params;

  try {
    const devis = await db('co_devis').select('devis_type').where('devis_id', id).first();

    if (!devis) {
      return res.status(404).json({ message: 'Devis non trouvé' });
    }

    const tableMap = {
      ST: 'st_devis_details',
      FF: 'ff_devis_details'
    };

    const tableName = tableMap[devis.devis_type];

    if (!tableName) {
      return res.status(400).json({ message: `Type de devis invalide: ${devis.devis_type}` });
    }

    const elements = await db(tableName).select('*').where('devis_id', id);
    res.status(200).json(elements);
  } catch (err) {
    console.error('Erreur lors de la récupération du devis:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});
router.get('/invoice-details/:id', checkPermission('CanViewInvoices'), async (req, res) => {
  const { id } = req.params;

  try {
    const devis = await db
      .select(
        'co_devis.*',
        'w_clients.client_name',
        'w_clients.client_address',
        'w_clients.client_ice',
        db.raw(
          "CONCAT(co_devis.devis_full_id, IF(co_devis.devis_version > 0, CONCAT('.V', co_devis.devis_version), '')) as devis_formatted_id"
        ),
        db.raw("CASE WHEN co_devis.devis_currency = 1 THEN 'dirhams' ELSE 'euros' END AS currency"),
        db.raw("DATE_FORMAT(purchase_date, '%d/%m/%Y') as purchase_date"),
        'co_purchases.purchase_order_ref',
        'es_files.es_file_full_id',
        'co_modalities.modality_name'
      )
      .from('co_devis')

      .leftJoin('w_clients', 'co_devis.devis_fk_client_id', 'w_clients.client_id')
      .leftJoin('co_purchases', 'co_purchases.purchase_fk_devis_id', 'devis_id')
      .leftJoin('es_files', 'co_devis.devis_fk_file_id', 'es_files.es_file_id')
      .leftJoin('co_modalities', 'co_devis.devis_fk_modality_id', 'co_modalities.modality_id')
      .where('co_devis.devis_id', id);
    if (devis.length === 0) {
      return res.status(404).json({
        title: 'Devis non trouvé',
        subtitle: "Le devis spécifié n'existe pas"
      });
    }

    const devisId = devis[0].devis_id;
    if (devis[0].devis_type === 'ST') {
      const elements = await db
        .select(
          'co_e_devis_elements.*',
          'co_labtests.*',
          'co_methods.*',
          db.raw("CONCAT(co_e_devis_elements.element_discount, '%') as discount"),
          db.raw(
            'co_labtests.labtest_price * co_e_devis_elements.element_quantity * (1 - co_e_devis_elements.element_discount / 100) as total_price'
          )
        )
        .from('co_e_devis_elements')
        .leftJoin('co_labtests', 'co_e_devis_elements.element_test_id', 'co_labtests.labtest_id')
        .leftJoin('co_methods', 'co_labtests.labtest_fk_method_id', 'co_methods.method_id')
        .where('element_fk_devis_id', devisId)
        .orderBy('element_id', 'asc');

      devis[0].devis_elements = elements;
    } else if (devis[0].devis_type === 'FF') {
      const elements = await db
        .select(
          '*',
          db.raw("CONCAT(element_discount, '%') as discount"),
          db.raw('element_price * element_quantity * (1 - element_discount / 100) as total_price')
        )
        .from('co_ff_devis_elements')
        .where('element_fk_devis_id', devisId)
        .orderBy('element_id', 'asc');

      devis[0].devis_elements = elements;
    }
    res.status(200).json(devis[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Erreur interne du serveur'
    });
  }
});
router.post('/invoices', checkPermission('CanPOSTInvoices'), async (req, res) => {
  const trx = await db.transaction();
  try {
    const invoice = req.body;
    const devisId = invoice.devis_id;

    const devisDetails = await trx('co_devis').select('*').where('devis_id', devisId).first();
    if (!devisDetails) {
      await trx.rollback();
      return res.status(404).json({ error: 'Devis non trouvé' });
    }

    const devisStatus = devisDetails.devis_fk_status;
    if (devisStatus !== 8) {
      await trx.rollback();
      return res.status(403).json({
        error: 'Permission non accordée',
        message: "Vous n'avez pas la permission d'effectuer cette action"
      });
    }

    const invoiceExists = await trx('co_invoices').select('*').where('invoice_fk_devis_id', devisId).first();
    if (invoiceExists) {
      await trx.rollback();
      return res.status(409).json({
        error: 'Facture déjà existante',
        description: `Une facture pour ce devis existe déjà.`
      });
    }

    await trx('co_devis').update('devis_fk_status', 9).where('devis_id', devisId);

    const nextId = await GetNextInvoiceId();

    const [insertInvoiceId] = await trx('co_invoices').insert({
      invoice_full_id: nextId,
      invoice_date: invoice.invoice_date,
      invoice_notes: invoice.invoice_note,
      invoice_fk_devis_id: devisId,
      invoice_fk_user_id: req.user.user_id,
      invoice_fk_norm_id: invoice.norm_id,
      invoice_conformity: invoice.conformity,
      invoice_comment: invoice.invoice_comment
    });

    await trx('co_invoices_comments').insert({
      invoice_comment_title: 'Facture créée',
      invoice_comment_content: `La facture ${nextId} a été créée par ${req.user.user_full_name}`,
      invoice_comment_sent_time: new Date(),
      invoice_comment_status: 1,
      invoice_comment_fk_user_id: req.user.user_id,
      invoice_comment_fk_invoice_id: insertInvoiceId
    });

    await trx('w_activity_log').insert({
      user_id: req.user.user_id,
      action: 'Facture créée',
      details: `Facture ${nextId} créée par ${req.user.user_full_name}`,
      timestamp: new Date()
    });

    await trx.commit();

    res.status(200).json({
      success: 'Facture ajoutée avec succès',
      description: `La facture "${nextId}" a été ajoutée avec succès.`
    });
  } catch (err) {
    await trx.rollback();

    console.error(err);
    res.status(500).json({
      error: "Erreur lors de l'ajout de la facture",
      description: "Erreur interne, Contactez l'administrateur"
    });
  }
});
router.get('/delivery-notes', checkPermission('CanViewInvoices'), async (req, res) => {
  try {
    const deliveryNotes = await db.select('*').from('delivery_notes').orderBy('dn_id', 'desc');
    res.status(200).json(deliveryNotes);
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});
router.get('/delivery-note/:id', checkPermission('CanViewInvoices'), async (req, res) => {
  const { id } = req.params;

  try {
    const deliveryNotes = await db
      .select(
        'co_delivery_notes.*',
        db.raw("DATE_FORMAT(dn_date, '%d/%m/%Y') as delivery_date"),
        'co_invoices.invoice_full_id',
        db.raw("DATE_FORMAT(invoice_date, '%d/%m/%Y') as invoice_date"),
        'w_clients.*',
        'es_files.es_file_full_id',
        'co_devis.devis_id',
        'co_devis.devis_full_id',
        'co_devis.devis_version',
        'co_devis.devis_type',
        'co_purchases.purchase_order_ref',
        db.raw("DATE_FORMAT(purchase_date, '%d/%m/%Y') as purchase_date"),
        db.raw(
          "CONCAT(co_devis.devis_full_id, IF(co_devis.devis_version > 0, CONCAT('.V', co_devis.devis_version), '')) as devis_formatted_id"
        ),
        'co_devis.devis_total_ht',
        'co_devis.devis_total_ttc'
      )
      .from('co_delivery_notes')
      .join('co_invoices', 'co_delivery_notes.dn_fk_invoice_id', 'co_invoices.invoice_id')
      .join('co_devis', 'co_invoices.invoice_fk_devis_id', 'co_devis.devis_id')
      .leftJoin('w_clients', 'co_devis.devis_fk_client_id', 'w_clients.client_id')
      .leftJoin('es_files', 'co_devis.devis_fk_file_id', 'es_files.es_file_id')
      .leftJoin('co_purchases', 'co_purchases.purchase_fk_devis_id', 'co_devis.devis_id')
      .where('dn_full_id', id);

    if (deliveryNotes.length === 0) {
      return res.status(404).json({ error: 'Bon de livraison non trouvé' });
    }

    const deliveryNote = deliveryNotes[0];
    const devisId = deliveryNote.devis_id;

    if (deliveryNote.devis_type === 'ST') {
      const elements = await db
        .select('co_e_devis_elements.element_quantity', 'co_labtests.labtest_designation')
        .from('co_e_devis_elements')
        .leftJoin('co_labtests', 'co_e_devis_elements.element_test_id', 'co_labtests.labtest_id')
        .where('element_fk_devis_id', devisId)
        .orderBy('element_id', 'asc');

      deliveryNote.devis_elements = elements;
    } else if (deliveryNote.devis_type === 'FF') {
      const elements = await db
        .select('element_designation', 'element_quantity')
        .from('co_ff_devis_elements')
        .where('element_fk_devis_id', devisId)
        .orderBy('element_id', 'asc');

      deliveryNote.devis_elements = elements;
    }
    res.status(200).json(deliveryNote);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Erreur interne du serveur'
    });
  }
});
router.post('/delivery-notes', checkPermission('CanPOSTInvoices'), async (req, res) => {
  const { invoice_id, dn_date } = req.body;
  const trx = await db.transaction();
  try {
    const invoiceDetails = await trx('co_invoices').select('*').where('invoice_id', invoice_id);
    if (invoiceDetails.length === 0) {
      await trx.rollback();
      return res.status(404).json({ error: 'Facture non trouvée' });
    }
    const deliveryNoteExists = await trx('co_delivery_notes').select('*').where('dn_fk_invoice_id', invoice_id);
    if (deliveryNoteExists.length > 0) {
      await trx.rollback();
      return res.status(409).json({
        error: 'Bon de livraison déjà existant',
        description: `Un bon de livraison pour cette facture existe déjà.`
      });
    }
    const nextId = await GetNextDNId();
    await trx('co_delivery_notes').insert({
      dn_full_id: nextId,
      dn_date: dn_date,
      dn_fk_invoice_id: invoice_id
    });
    await trx('w_activity_log').insert({
      user_id: req.user.user_id,
      action: 'Bon de livraison créé',
      details: `Bon de livraison ${nextId} créé par ${req.user.user_full_name}`,
      timestamp: new Date()
    });
    await trx.commit();
    res.status(200).json({
      success: 'Bon de livraison ajouté avec succès',
      description: `Le bon de livraison "${nextId}" a été ajouté avec succès.`
    });
  } catch (err) {
    await trx.rollback();
    res.status(500).json({
      error: "Erreur lors de l'ajout du bon de livraison",
      description: "Erreur interne, Contactez l'administrateur"
    });
    console.log(err);
  }
});
router.get('/credit-notes', checkPermission('CanViewInvoices'), async (req, res) => {
  try {
    const creditNotes = await db.select('*').from('credit_notes').orderBy('cn_id', 'desc');
    res.status(200).json(creditNotes);
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});
router.get('/credit-note/:id', checkPermission('CanViewInvoices'), async (req, res) => {
  const { id } = req.params;

  try {
    const deliveryNotes = await db
      .select(
        'co_credit_notes.*',
        db.raw("DATE_FORMAT(cn_date, '%d/%m/%Y') as credit_date"),
        'co_invoices.invoice_full_id',
        db.raw("DATE_FORMAT(invoice_date, '%d/%m/%Y') as invoice_date"),
        'w_clients.*',
        'es_files.es_file_full_id',
        'co_devis.*',
        'co_purchases.purchase_order_ref',
        db.raw("DATE_FORMAT(purchase_date, '%d/%m/%Y') as purchase_date"),
        db.raw(
          "CONCAT(co_devis.devis_full_id, IF(co_devis.devis_version > 0, CONCAT('.V', co_devis.devis_version), '')) as devis_formatted_id"
        ),
        'w_client_segment.segment_name',
        'w_types.type_name',
        'co_modalities.modality_name',
        'co_invoice_norms.norm_name',
        'w_users.user_full_name'
      )
      .from('co_credit_notes')
      .join('co_invoices', 'co_credit_notes.cn_fk_invoice_id', 'co_invoices.invoice_id')
      .join('co_devis', 'co_invoices.invoice_fk_devis_id', 'co_devis.devis_id')
      .leftJoin('w_clients', 'co_devis.devis_fk_client_id', 'w_clients.client_id')
      .leftJoin('es_files', 'co_devis.devis_fk_file_id', 'es_files.es_file_id')
      .leftJoin('co_purchases', 'co_purchases.purchase_fk_devis_id', 'co_devis.devis_id')
      .leftJoin('co_modalities', 'co_devis.devis_fk_modality_id', 'co_modalities.modality_id')
      .leftJoin('w_types', 'co_devis.devis_fk_type_id', 'w_types.type_id')
      .leftJoin('w_client_segment', 'co_devis.devis_fk_segment_id', 'w_client_segment.segment_id')
      .leftJoin('w_users', 'co_invoices.invoice_fk_user_id', 'w_users.user_id')
      .leftJoin('co_invoice_norms', 'co_invoices.invoice_fk_norm_id', 'co_invoice_norms.norm_id')
      .where('cn_full_id', id);

    if (deliveryNotes.length === 0) {
      return res.status(404).json({ error: 'Bon de livraison non trouvé' });
    }

    const deliveryNote = deliveryNotes[0];
    const devisId = deliveryNote.devis_id;

    if (deliveryNote.devis_type === 'ST') {
      const elements = await db
        .select(
          'co_e_devis_elements.*',
          'co_labtests.*',
          'co_methods.*',
          db.raw("CONCAT(co_e_devis_elements.element_discount, '%') as discount"),
          db.raw(
            'co_labtests.labtest_price * co_e_devis_elements.element_quantity * (1 - co_e_devis_elements.element_discount / 100) as total_price'
          )
        )
        .from('co_e_devis_elements')
        .leftJoin('co_labtests', 'co_e_devis_elements.element_test_id', 'co_labtests.labtest_id')
        .leftJoin('co_methods', 'co_labtests.labtest_fk_method_id', 'co_methods.method_id')
        .where('element_fk_devis_id', devisId)
        .orderBy('element_id', 'asc');

      deliveryNote.devis_elements = elements;
    } else if (deliveryNote.devis_type === 'FF') {
      const elements = await db
        .select(
          '*',
          db.raw("CONCAT(element_discount, '%') as discount"),
          db.raw('element_price * element_quantity * (1 - element_discount / 100) as total_price')
        )
        .from('co_ff_devis_elements')
        .where('element_fk_devis_id', devisId)
        .orderBy('element_id', 'asc');

      deliveryNote.devis_elements = elements;
    }
    res.status(200).json(deliveryNote);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Erreur interne du serveur'
    });
  }
});

router.post('/credit-notes', checkPermission('CanPOSTInvoices'), async (req, res) => {
  const { invoice_id, cn_date, cn_comment } = req.body;
  const trx = await db.transaction();
  try {
    const invoiceDetails = await trx('co_invoices').select('*').where('invoice_id', invoice_id);
    if (invoiceDetails.length === 0) {
      await trx.rollback();
      return res.status(404).json({ error: 'Facture non trouvée' });
    }
    const creditNoteExists = await trx('co_credit_notes').select('*').where('cn_fk_invoice_id', invoice_id);
    if (creditNoteExists.length > 0) {
      await trx.rollback();
      return res.status(409).json({
        error: 'Avoir déjà existant',
        description: `Un avoir pour cette facture existe déjà.`
      });
    }
    const nextId = await GetNextCNId();
    await trx('co_credit_notes').insert({
      cn_full_id: nextId,
      cn_date: cn_date,
      cn_comment: cn_comment,
      cn_fk_invoice_id: invoice_id
    });
    await trx('w_activity_log').insert({
      user_id: req.user.user_id,
      action: 'Avoir créé',
      details: `Avoir ${nextId} créé par ${req.user.user_full_name}`,
      timestamp: new Date()
    });
    await trx.commit();
    res.status(200).json({
      success: 'Avoir ajouté avec succès',
      description: `L'avoir "${nextId}" a été ajouté avec succès.`
    });
  } catch (err) {
    await trx.rollback();
    res.status(500).json({
      error: "Erreur lors de l'ajout de l'avoir",
      description: "Erreur interne, Contactez l'administrateur"
    });
    console.log(err);
  }
});

const getLastSixMonths = () => {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    months.push(dayjs().subtract(i, 'month').format('YYYY-MM'));
  }
  return months;
};

router.get('/dash-stats', async (req, res) => {
  try {
    const referenceMonths = getLastSixMonths();

    const getCountData = async (tableName, dateColumn) => {
      return db(tableName)
        .select(db.raw(`DATE_FORMAT(${dateColumn}, '%Y-%m') as month_year`), db.raw('COUNT(*) as count'))
        .where(dateColumn, '>', db.raw('CURDATE() - INTERVAL 6 MONTH'))
        .groupBy('month_year')
        .orderBy('month_year', 'desc');
    };

    // Get data for each table
    const filesData = await getCountData('es_files', 'es_file_opening_date');
    const samplesData = await getCountData('es_samples', 'es_sample_date');
    const reportsData = await getCountData('es_reports', 'es_report_date');
    const devisData = await getCountData('co_devis', 'devis_date');
    const purchasesData = await getCountData('co_purchases', 'purchase_date');

    // Get data for co_invoices joined with co_devis
    const invoicesData = await db('co_invoices')
      .join('co_devis', 'co_invoices.invoice_fk_devis_id', 'co_devis.devis_id')
      .select(db.raw('DATE_FORMAT(co_invoices.invoice_date, "%Y-%m") as month_year'), db.raw('SUM(co_devis.devis_total_ht) as total_ht'))
      .where('co_invoices.invoice_date', '>', db.raw('CURDATE() - INTERVAL 6 MONTH'))
      .groupBy('month_year')
      .orderBy('month_year', 'desc');

    // Helper function to merge data with reference months
    const mergeData = (data, referenceMonths, valueKey = 'count') => {
      return referenceMonths.map((monthYear) => {
        const foundData = data.find((d) => d.month_year === monthYear);
        return {
          month_year: monthYear,
          [valueKey]: foundData ? foundData[valueKey] : 0
        };
      });
    };

    // Merge data with reference months
    const mergedFilesData = mergeData(filesData, referenceMonths);
    const mergedSamplesData = mergeData(samplesData, referenceMonths);
    const mergedReportsData = mergeData(reportsData, referenceMonths);
    const mergedDevisData = mergeData(devisData, referenceMonths);
    const mergedPurchasesData = mergeData(purchasesData, referenceMonths);
    const mergedInvoicesData = mergeData(invoicesData, referenceMonths, 'total_ht');

    // Send the response
    res.json({
      files: mergedFilesData,
      samples: mergedSamplesData,
      reports: mergedReportsData,
      devis: mergedDevisData,
      purchases: mergedPurchasesData,
      invoices: mergedInvoicesData
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching statistics. Please try again later.'
    });
  }
});
router.get('/devis-templates', checkPermission('CanViewDevis'), async (req, res) => {
  try {
    const devis = await db('co_templates')
      .select('template_id', 'template_full_id', 'template_name', 'template_object', 'w_types.type_name', 'w_client_segment.segment_name')
      .leftJoin('w_types', 'co_templates.template_fk_type', 'w_types.type_id')
      .leftJoin('w_client_segment', 'co_templates.template_fk_segment', 'w_client_segment.segment_id')
      .orderBy('template_full_id');

    res.status(200).json(devis);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
router.get('/devis-template/:id', checkPermission('CanViewDevis'), async (req, res) => {
  const { id } = req.params;

  try {
    const template = await db
      .select(
        'co_templates.*',
        'w_users.user_full_name',
        'w_types.type_name',
        'co_modalities.modality_name',
        'w_client_segment.segment_name'
      )
      .from('co_templates')
      .leftJoin('w_users', 'co_templates.template_fk_user_id', 'w_users.user_id')
      .leftJoin('w_types', 'co_templates.template_fk_type', 'w_types.type_id')
      .leftJoin('co_modalities', 'co_templates.template_fk_modality', 'co_modalities.modality_id')
      .leftJoin('w_client_segment', 'co_templates.template_fk_segment', 'w_client_segment.segment_id')
      .where('co_templates.template_full_id', id)
      .first();

    if (!template) {
      return res.status(404).json({
        title: 'Devis non trouvé',
        subtitle: "Le devis spécifié n'existe pas"
      });
    }

    const devisId = template.template_id;
    const elements = await db
      .select(
        'co_template_elements.*',
        'co_labtests.*',
        'co_methods.*',
        db.raw("CONCAT(co_template_elements.element_discount, '%') as discount"),
        db.raw(
          'co_labtests.labtest_price * co_template_elements.element_quantity * (1 - co_template_elements.element_discount / 100) as total_price'
        )
      )
      .from('co_template_elements')
      .leftJoin('co_labtests', 'co_template_elements.element_test_id', 'co_labtests.labtest_id')
      .leftJoin('co_methods', 'co_labtests.labtest_fk_method_id', 'co_methods.method_id')
      .where('element_fk_template_id', devisId)
      .orderBy('element_id', 'asc');

    const total_ht = elements.reduce((sum, element) => sum + parseFloat(element.total_price), 0);

    const total_ttc = total_ht * template.template_tax * 1.2;

    template.devis_elements = elements;
    template.total_ht = total_ht;
    template.total_ttc = total_ttc;

    res.status(200).json(template);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Erreur interne du serveur'
    });
  }
});
router.post('/add-template', checkPermission('CanPOSTDevis'), async (req, res) => {
  const trx = await db.transaction();

  try {
    let template = req.body;

    if (!template) {
      return res.status(400).json({
        title: 'Erreur',
        subtitle: 'Veuillez renseigner tous les champs'
      });
    }

    const nextTemplateFullId = await GetNextTemplateId();
    template.template_full_id = nextTemplateFullId;

    const [templateId] = await trx('co_templates').insert({
      template_full_id: template.template_full_id,
      template_name: template.name,
      template_object: template.devis_object,
      template_note: template.devis_note || '',
      template_tax: template.tva,
      template_currency: template.currency,
      template_fk_user_id: req.user.user_id,
      template_fk_segment: template.segment_id,
      template_fk_type: template.type_id,
      template_fk_modality: template.modality_id
    });
    const elements = template.tests.map((element) => ({
      element_fk_template_id: templateId,
      element_test_id: element.designation,
      element_note: element.note || '',
      element_quantity: element.quantity,
      element_discount: element.discount
    }));

    await trx('co_template_elements').insert(elements);

    await trx.commit();

    res.status(200).json({
      success: 'Modèle ajouté',
      description: 'Le modèle de devis a été ajouté'
    });
  } catch (err) {
    await trx.rollback();
    console.error(err);
    res.status(500).json({
      error: "Erreur lors de l'ajout du modèle",
      description: "Erreur interne, Contactez l'administrateur"
    });
  }
});
router.put('/update-template/:id', checkPermission('CanPOSTDevis'), async (req, res) => {
  const trx = await db.transaction();

  try {
    let template = req.body;

    if (!template) {
      return res.status(400).json({
        title: 'Erreur',
        subtitle: 'Veuillez renseigner tous les champs'
      });
    }
    const templateFullId = req.params.id;
    const { template_id } = await db('co_templates').select('template_id').where('template_full_id', templateFullId).first();
    await trx('co_templates')
      .update({
        template_name: template.name,
        template_object: template.devis_object,
        template_note: template.devis_note || '',
        template_tax: template.tva,
        template_currency: template.currency,
        template_fk_user_id: req.user.user_id,
        template_fk_segment: template.segment_id,
        template_fk_type: template.type_id,
        template_fk_modality: template.modality_id
      })
      .where('template_full_id', templateFullId);
    const elements = template.tests.map((element) => ({
      element_fk_template_id: template_id,
      element_test_id: element.designation,
      element_note: element.note || '',
      element_quantity: element.quantity,
      element_discount: element.discount
    }));

    await trx('co_template_elements').where('element_fk_template_id', template_id).del();

    await trx('co_template_elements').insert(elements);

    await trx.commit();

    res.status(200).json({
      success: 'Modèle mis à jour',
      description: 'Le modèle de devis a été mis à jour'
    });
  } catch (err) {
    await trx.rollback();
    console.error(err);
    res.status(500).json({
      error: 'Erreur lors de la mise à jour du modèle',
      description: "Erreur interne, Contactez l'administrateur"
    });
  }
});
async function getKeyFigures(start_date, end_date) {
  const defaultStartDate = dayjs('2023-06-21').format('YYYY-MM-DD');
  const defaultEndDate = dayjs().format('YYYY-MM-DD');

  start_date = start_date ? dayjs(start_date).format('YYYY-MM-DD') : defaultStartDate;
  end_date = end_date ? dayjs(end_date).format('YYYY-MM-DD') : defaultEndDate;

  // Start transaction
  const trx = await db.transaction();

  try {
    // Run all queries in parallel using Promise.all
    const [total_devis, total_purchases, total_samples, total_analyses, total_reports, total_files, total_invoices] = await Promise.all([
      trx('co_devis').whereBetween('devis_date', [start_date, end_date]).count('* as total_devis'),

      trx('co_purchases').whereBetween('purchase_date', [start_date, end_date]).count('* as total_purchases'),

      trx('es_samples').whereBetween('es_sample_date', [start_date, end_date]).count('* as total_samples'),

      trx('co_e_devis_elements')
        .sum('element_quantity as total_analyses')
        .leftJoin('co_devis', 'co_e_devis_elements.element_fk_devis_id', 'co_devis.devis_id')
        .where('co_devis.devis_type', 'ST')
        .whereIn('co_devis.devis_fk_status', [8, 9])
        .whereBetween('co_devis.devis_date', [start_date, end_date]),

      trx('es_reports').whereBetween('es_report_date', [start_date, end_date]).count('* as total_reports'),

      trx('es_files').whereBetween('es_file_opening_date', [start_date, end_date]).count('* as total_files'),

      trx('co_devis')
        .join('co_invoices', 'co_devis.devis_id', 'co_invoices.invoice_fk_devis_id')
        .sum('co_devis.devis_total_ht as sum')
        .whereBetween('co_invoices.invoice_date', [start_date, end_date])
    ]);

    // Commit transaction
    await trx.commit();

    // Return the results
    return {
      total_devis: total_devis[0].total_devis,
      total_purchases: total_purchases[0].total_purchases,
      total_samples: total_samples[0].total_samples,
      total_analyses: Math.round(total_analyses[0].total_analyses),
      total_reports: total_reports[0].total_reports,
      total_files: total_files[0].total_files,
      total_invoices: total_invoices[0].sum || 0 // Handle case where sum might be null
    };
  } catch (error) {
    // Rollback transaction in case of error
    await trx.rollback();

    console.error('Error in getKeyFigures:', error);
    throw new Error('Internal error while fetching key figures. Please contact support.');
  }
}
/**
 * Retrieves data related to "devis" within a specified date range.
 *
 * @param {string} start_date - The start date of the range (optional, defaults to 21/06/2023).
 * @param {string} end_date - The end date of the range (optional, defaults to today).
 * @return {Promise<Object>} An object containing the following data:
 *   - devisStackedData: An array of objects representing the number of devis per month,
 *                       with properties "month" and "total_devis" for stacked bar chart.
 *   - devisByTypeData: An array of objects representing the number of devis by type,
 *                       with properties "type_name" and "total_devis" for bar chart.
 *   - conversionRate: The conversion rate for "Prestation Industriel" devis,
 *                      calculated as the percentage of accepted devis.
 *   - averageAcceptanceTime: The average acceptance time for "devis" based on purchase_date.
 *   - revisionRate: The revision rate for "devis", calculated as the percentage of revised devis.
 *   - totalDevis: The total number of devis within the specified date range.
 * @throws {Error} If there is an error fetching the data.
 */
async function getDevisData(start_date, end_date) {
  // Default date range from 21/06/2023 to today
  const defaultStartDate = dayjs('2023-06-21').format('YYYY-MM-DD');
  const defaultEndDate = dayjs().format('YYYY-MM-DD');

  start_date = start_date ? dayjs(start_date).format('YYYY-MM-DD') : defaultStartDate;
  end_date = end_date ? dayjs(end_date).format('YYYY-MM-DD') : defaultEndDate;

  // Start transaction
  const trx = await db.transaction();

  try {
    // Get all relevant "devis" data concurrently
    const [
      devisStackedData,
      devisByTypeData,
      devisBySegmentData,
      conversionRateData,
      averageAcceptanceTimeData,
      revisionRateData,
      totalDevisData
    ] = await Promise.all([
      // 1. Stacked bar chart for number of devis per month
      trx('co_devis')
        .select(trx.raw("DATE_FORMAT(devis_date, '%Y-%m') AS month"))
        .count('* as total_devis')
        .select(trx.raw('SUM(CASE WHEN devis_fk_type_id = 1 THEN 1 ELSE 0 END) as control_obligatoire'))
        .select(trx.raw('SUM(CASE WHEN devis_fk_type_id != 1 THEN 1 ELSE 0 END) as prestation_indus'))
        .whereBetween('devis_date', [start_date, end_date])
        .groupBy('month')
        .orderBy('month'),

      // 2. Bar chart for "Prestation Industriel" grouped by w_types.type_name
      trx('co_devis')
        .select('w_types.type_name')
        .count('* as total_devis')
        .join('w_types', 'w_types.type_id', 'co_devis.devis_fk_type_id')
        .where('devis_fk_type_id', '!=', 1)
        .whereBetween('devis_date', [start_date, end_date])
        .groupBy('w_types.type_name')
        .orderBy('total_devis'),
      trx('co_devis')
        .select('w_client_segment.segment_name')
        .count('* as total_devis')
        .join('w_client_segment', 'w_client_segment.segment_id', 'co_devis.devis_fk_segment_id')
        .where('devis_fk_type_id', '!=', 1)
        .whereBetween('devis_date', [start_date, end_date])
        .groupBy('w_client_segment.segment_name')
        .orderBy('total_devis'),

      // 3. Conversion rate for "Prestation Industriel" (devis_fk_status >= 8 means accepted)
      trx('co_devis')
        .count('* as accepted_devis')
        .where('devis_fk_type_id', '!=', 1)
        .andWhere('devis_fk_status', '>=', 8)
        .whereBetween('devis_date', [start_date, end_date])
        .then(([result]) => result.accepted_devis),

      // 4. Average acceptance time based on purchase_date from co_purchases
      trx('co_purchases')
        .select(trx.raw('AVG(DATEDIFF(devis_date, purchase_date)) as avg_acceptance_time'))
        .join('co_devis', 'co_devis.devis_id', 'co_purchases.purchase_fk_devis_id')
        .whereBetween('devis_date', [start_date, end_date])
        .then(([result]) => result.avg_acceptance_time),

      // 5. Revision rate for "devis" (where devis_version > 1)
      trx('co_devis').countDistinct('devis_full_id as revised_devis_count').where('devis_version', '>', 1),

      // 6. Total number of devis for calculating the revision rate
      trx('co_devis').count('* as total_devis_count').where('devis_fk_type_id', '!=', 1).whereBetween('devis_date', [start_date, end_date])
    ]);

    const revisionRate = Math.round((revisionRateData[0].revised_devis_count / totalDevisData[0].total_devis_count) * 100);

    // Commit transaction
    await trx.commit();

    // Return all calculated data
    return {
      devisStackedData,
      devisByTypeData,
      devisBySegmentData,
      conversionRate: Math.round((conversionRateData / totalDevisData[0].total_devis_count) * 100),
      averageAcceptanceTime: Math.round(averageAcceptanceTimeData),
      revisionRate,
      totalDevis: totalDevisData[0].total_devis_count
    };
  } catch (error) {
    // Rollback transaction in case of error
    await trx.rollback();
    console.log(error);
    throw new Error('Error fetching devis data');
  }
}
async function getPurchaseData(start_date, end_date) {
  // Default date range from 21/06/2023 to today
  const defaultStartDate = dayjs('2023-06-21').format('YYYY-MM-DD');
  const defaultEndDate = dayjs().format('YYYY-MM-DD');

  start_date = start_date ? dayjs(start_date).format('YYYY-MM-DD') : defaultStartDate;
  end_date = end_date ? dayjs(end_date).format('YYYY-MM-DD') : defaultEndDate;

  try {
    // Execute all queries in parallel using Promise.all
    const [
      totalPurchasesData,
      purchaseByMonthData,
      purchasesByTypeData,
      purchasesBySegmentData,
      averagePurchaseValueData,
      avgPurchaseByTypeData,
      avgPurchaseBySegmentData
    ] = await Promise.all([
      // Total purchases and breakdown by 'Controle Obligatoire' and 'Prestation Industriel'
      db('co_purchases')
        .count('* as total_purchases')
        .select(db.raw('SUM(CASE WHEN devis_fk_type_id = 1 THEN 1 ELSE 0 END) as control_obligatoire'))
        .select(db.raw('SUM(CASE WHEN devis_fk_type_id != 1 THEN 1 ELSE 0 END) as prestation_indus'))
        .join('co_devis', 'co_purchases.purchase_fk_devis_id', 'co_devis.devis_id')
        .whereBetween('purchase_date', [start_date, end_date]),

      // Purchases per month with the same breakdown
      db('co_purchases')
        .select(db.raw("DATE_FORMAT(purchase_date, '%Y-%m') AS month"))
        .count('* as total_purchases')
        .select(db.raw('SUM(CASE WHEN devis_fk_type_id = 1 THEN 1 ELSE 0 END) as control_obligatoire'))
        .select(db.raw('SUM(CASE WHEN devis_fk_type_id != 1 THEN 1 ELSE 0 END) as prestation_indus'))
        .join('co_devis', 'co_purchases.purchase_fk_devis_id', 'co_devis.devis_id')
        .whereBetween('purchase_date', [start_date, end_date])
        .groupBy('month')
        .orderBy('month'),

      // Purchases grouped by w_types.type_name
      db('co_devis')
        .select('w_types.type_name')
        .count('* as total_purchases')
        .join('w_types', 'w_types.type_id', 'co_devis.devis_fk_type_id')
        .join('co_purchases', 'co_devis.devis_id', 'co_purchases.purchase_fk_devis_id')
        .whereBetween('purchase_date', [start_date, end_date])
        .groupBy('w_types.type_name')
        .orderBy('total_purchases'),
      db('co_devis')
        .select('w_client_segment.segment_name')
        .count('* as total_purchases')
        .join('w_client_segment', 'w_client_segment.segment_id', 'co_devis.devis_fk_segment_id')
        .join('co_purchases', 'co_devis.devis_id', 'co_purchases.purchase_fk_devis_id')
        .whereBetween('purchase_date', [start_date, end_date])
        .groupBy('w_client_segment.segment_name')
        .orderBy('total_purchases'),

      // Average purchase value
      db('co_devis')
        .avg('devis_total_ht as average_purchase_value')
        .join('co_purchases', 'co_devis.devis_id', 'co_purchases.purchase_fk_devis_id')
        .whereBetween('purchase_date', [start_date, end_date]),

      // Average purchase value by w_types.type_name
      db('co_devis')
        .select('w_types.type_name')
        .avg('devis_total_ht as average_purchase_value')
        .join('w_types', 'w_types.type_id', 'co_devis.devis_fk_type_id')
        .join('co_purchases', 'co_devis.devis_id', 'co_purchases.purchase_fk_devis_id')
        .whereBetween('purchase_date', [start_date, end_date])
        .groupBy('w_types.type_name'),
      db('co_devis')
        .select('w_client_segment.segment_name')
        .avg('devis_total_ht as average_purchase_value')
        .join('w_client_segment', 'w_client_segment.segment_id', 'co_devis.devis_fk_segment_id')
        .join('co_purchases', 'co_devis.devis_id', 'co_purchases.purchase_fk_devis_id')
        .whereBetween('purchase_date', [start_date, end_date])
        .groupBy('w_client_segment.segment_name')
    ]);

    return {
      totalPurchases: totalPurchasesData[0].total_purchases,
      controlObligatoire: totalPurchasesData[0].control_obligatoire,
      prestationIndustriel: totalPurchasesData[0].prestation_indus,
      purchaseByMonth: purchaseByMonthData,
      purchasesByType: purchasesByTypeData,
      purchasesBySegment: purchasesBySegmentData,
      averagePurchaseValue: Math.round(averagePurchaseValueData[0].average_purchase_value),
      avgPurchaseByType: avgPurchaseByTypeData.map((item) => ({
        type_name: item.type_name,
        average_purchase_value: Math.round(item.average_purchase_value)
      })),
      avgPurchaseBySegment: avgPurchaseBySegmentData.map((item) => ({
        segment_name: item.segment_name,
        average_purchase_value: Math.round(item.average_purchase_value)
      }))
    };
  } catch (error) {
    console.error('Error fetching purchase data:', error);
    throw new Error('Error fetching purchase data');
  }
}
async function getInvoiceData(start_date, end_date) {
  // Default date range from 21/06/2023 to today
  const defaultStartDate = dayjs('2023-06-21').format('YYYY-MM-DD');
  const defaultEndDate = dayjs().format('YYYY-MM-DD');

  start_date = start_date ? dayjs(start_date).format('YYYY-MM-DD') : defaultStartDate;
  end_date = end_date ? dayjs(end_date).format('YYYY-MM-DD') : defaultEndDate;

  try {
    // Execute all queries in parallel using Promise.all
    const [invoiceStackedData, invoiceByType, invoiceBySegment, invoiceByTypePerMonth, invoiceBySegmentPerMonth, topClients] =
      await Promise.all([
        // invoiceStackedData: count invoices by month, split between type 1 and others
        db('co_invoices')
          .select(db.raw("DATE_FORMAT(invoice_date, '%Y-%m') AS month"))
          .select(db.raw('SUM(CASE WHEN co_devis.devis_fk_type_id = 1 THEN co_devis.devis_total_ht ELSE 0 END) as control_obligatoire'))
          .select(db.raw('SUM(CASE WHEN co_devis.devis_fk_type_id != 1 THEN co_devis.devis_total_ht ELSE 0 END) as prestation_indus'))
          .join('co_devis', 'co_invoices.invoice_fk_devis_id', 'co_devis.devis_id')
          .whereBetween('co_invoices.invoice_date', [start_date, end_date])
          .groupBy('month')
          .orderBy('month'),

        // invoiceByType: sum by each type in w_types (pie chart)
        db('co_invoices')
          .select('w_types.type_name')
          .sum('co_devis.devis_total_ht as total_ht')
          .join('co_devis', 'co_invoices.invoice_fk_devis_id', 'co_devis.devis_id')
          .join('w_types', 'co_devis.devis_fk_type_id', 'w_types.type_id')
          .whereBetween('co_invoices.invoice_date', [start_date, end_date])
          .groupBy('w_types.type_name'),

        // invoiceBySegment: sum by client segment (pie chart)
        db('co_invoices')
          .select('w_client_segment.segment_name')
          .sum('co_devis.devis_total_ht as total_ht')
          .join('co_devis', 'co_invoices.invoice_fk_devis_id', 'co_devis.devis_id')
          .join('w_client_segment', 'co_devis.devis_fk_segment_id', 'w_client_segment.segment_id')
          .whereBetween('co_invoices.invoice_date', [start_date, end_date])
          .groupBy('w_client_segment.segment_name'),

        // invoiceByTypePerMonth: sum per month for each type
        db('co_invoices')
          .select(db.raw("DATE_FORMAT(invoice_date, '%Y-%m') AS month"), 'w_types.type_name')
          .sum('co_devis.devis_total_ht as total_ht')
          .join('co_devis', 'co_invoices.invoice_fk_devis_id', 'co_devis.devis_id')
          .join('w_types', 'co_devis.devis_fk_type_id', 'w_types.type_id')
          .whereBetween('co_invoices.invoice_date', [start_date, end_date])
          .groupBy('month', 'w_types.type_name')
          .orderBy('month'),

        // invoiceBySegmentPerMonth: sum per month for each segment
        db('co_invoices')
          .select(db.raw("DATE_FORMAT(invoice_date, '%Y-%m') AS month"), 'w_client_segment.segment_name')
          .sum('co_devis.devis_total_ht as total_ht')
          .join('co_devis', 'co_invoices.invoice_fk_devis_id', 'co_devis.devis_id')
          .join('w_client_segment', 'co_devis.devis_fk_segment_id', 'w_client_segment.segment_id')
          .whereBetween('co_invoices.invoice_date', [start_date, end_date])
          .groupBy('month', 'w_client_segment.segment_name')
          .orderBy('month'),
        db('co_invoices')
          .select('w_clients.client_name')
          .sum('co_devis.devis_total_ht as total_ht')
          .join('co_devis', 'co_invoices.invoice_fk_devis_id', 'co_devis.devis_id')
          .join('w_clients', 'co_devis.devis_fk_client_id', 'w_clients.client_id')
          .whereBetween('co_invoices.invoice_date', [start_date, end_date])
          .groupBy('w_clients.client_name')
          .orderBy('total_ht', 'desc')
          .limit(30)
      ]);

    // Return the data
    return {
      invoiceStackedData,
      invoiceByType,
      invoiceBySegment,
      invoiceByTypePerMonth,
      invoiceBySegmentPerMonth,
      topClients
    };
  } catch (error) {
    console.error('Error fetching invoice data:', error);
    throw error;
  }
}
async function getLabData(start_date, end_date) {
  const defaultStartDate = dayjs('2023-06-21').format('YYYY-MM-DD');
  const defaultEndDate = dayjs().format('YYYY-MM-DD');

  start_date = start_date ? dayjs(start_date).format('YYYY-MM-DD') : defaultStartDate;
  end_date = end_date ? dayjs(end_date).format('YYYY-MM-DD') : defaultEndDate;

  try {
    const [
      totalFiles,
      totalExitFiles,
      totalClosedFiles,
      totalCanceledFiles,
      avgFileTime,
      samplesPerMonth,
      reportsPerMonth,
      filesPerMonth,
      filesByType,
      filesBySegment,
      filesByResp,
      filesByTech,
      filesByState,
      topClients
    ] = await Promise.all([
      db('es_files').count('* as total_files').whereBetween('es_file_opening_date', [start_date, end_date]),
      db('es_files').count('* as total_files').whereBetween('es_file_exit_date', [start_date, end_date]),
      db('es_files').count('* as total_files').whereBetween('es_file_closing_date', [start_date, end_date]),
      db('es_files')
        .count('* as total_files')
        .whereBetween('es_file_opening_date', [start_date, end_date])
        .andWhere('es_file_fk_status_id', '=', 0),

      // Average file time : avg time between opening and closing
      db('es_files')
        .avg(db.raw('DATEDIFF(es_file_closing_date, es_file_opening_date)'))
        .whereBetween('es_file_opening_date', [start_date, end_date]),
      // Samples per month
      db('es_samples')
        .select(db.raw("DATE_FORMAT(es_sample_date, '%Y-%m') AS month"))
        .count('* as total_samples')
        .whereBetween('es_sample_date', [start_date, end_date])
        .groupBy('month')
        .orderBy('month'),

      // Reports per month
      db('es_reports')
        .select(db.raw("DATE_FORMAT(es_report_date, '%Y-%m') AS month"))
        .count('* as total_reports')
        .whereBetween('es_report_date', [start_date, end_date])
        .groupBy('month')
        .orderBy('month'),

      // Files per month
      db('es_files')
        .select(db.raw("DATE_FORMAT(es_file_opening_date, '%Y-%m') AS month"))
        .count('* as total_files')
        .select(db.raw('SUM(CASE WHEN es_file_fk_type_id = 1 THEN 1 ELSE 0 END) as control_obligatoire'))
        .select(db.raw('SUM(CASE WHEN es_file_fk_type_id != 1 THEN 1 ELSE 0 END) as prestation_indus'))
        .whereBetween('es_file_opening_date', [start_date, end_date])
        .groupBy('month')
        .orderBy('month'),

      // Files by type
      db('es_files')
        .select('w_types.type_name')
        .count('* as total_files')
        .join('w_types', 'es_files.es_file_fk_type_id', 'w_types.type_id')
        .whereBetween('es_file_opening_date', [start_date, end_date])
        .groupBy('w_types.type_name')
        .orderBy('total_files', 'desc'),

      // Files by segment
      db('es_files')
        .select('w_client_segment.segment_name')
        .count('* as total_files')
        .join('w_client_segment', 'es_files.es_file_fk_segment_id', 'w_client_segment.segment_id')
        .whereBetween('es_file_opening_date', [start_date, end_date])
        .groupBy('w_client_segment.segment_name')
        .orderBy('total_files', 'desc'),

      // Files by responsible (resp)
      db('es_files')
        .select('w_users.user_full_name as responsible')
        .count('* as total_files')
        .join('w_users', 'es_files.es_file_fk_resp_id', 'w_users.user_id')
        .whereBetween('es_file_opening_date', [start_date, end_date])
        .groupBy('w_users.user_full_name')
        .orderBy('total_files', 'desc'),

      // Files by technician (tech)
      db('es_files')
        .select('w_users.user_full_name as technician')
        .count('* as total_files')
        .join('w_users', 'es_files.es_file_fk_tech_id', 'w_users.user_id')
        .whereBetween('es_file_opening_date', [start_date, end_date])
        .groupBy('w_users.user_full_name')
        .orderBy('total_files', 'desc'),

      // Files by state (on time vs late)
      db('es_files')
        .select(
          db.raw('SUM(CASE WHEN es_file_extern_deadline < es_file_submission_time THEN 1 ELSE 0 END) as late_files'),
          db.raw('SUM(CASE WHEN es_file_extern_deadline >= es_file_submission_time THEN 1 ELSE 0 END) as on_time_files')
        )
        .whereBetween('es_file_opening_date', [start_date, end_date]),

      // Top clients (by file count)
      db('es_files')
        .select('w_clients.client_name')
        .count('* as total_files')
        .join('w_clients', 'es_files.es_file_fk_client_id', 'w_clients.client_id')
        .whereBetween('es_file_opening_date', [start_date, end_date])
        .groupBy('w_clients.client_name')
        .orderBy('total_files', 'desc')
        .limit(30) // Adjust this limit as needed
    ]);

    // Return all the data
    return {
      totalFiles: totalFiles[0].total_files,
      totalExitFiles: totalExitFiles[0].total_files,
      totalClosedFiles: totalClosedFiles[0].total_files,
      totalCanceledFiles: totalCanceledFiles[0].total_files,
      avgFileTime: Math.round(avgFileTime[0]['avg(DATEDIFF(es_file_closing_date, es_file_opening_date))']),
      samplesPerMonth,
      reportsPerMonth,
      filesPerMonth,
      filesByType,
      filesBySegment,
      filesByResp,
      filesByTech,
      lateRate: Math.round((filesByState[0].late_files / (filesByState[0].late_files + filesByState[0].on_time_files)) * 100),
      topClients
    };
  } catch (error) {
    console.error('Error fetching lab data:', error);
    throw error;
  }
}

router.get('/comm-stats', checkPermission('CanAccessCommercialApp'), async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const keyFigures = await getKeyFigures(start_date, end_date);
    const devisData = await getDevisData(start_date, end_date);
    const purchaseData = await getPurchaseData(start_date, end_date);
    const invoiceData = await getInvoiceData(start_date, end_date);
    const labData = await getLabData(start_date, end_date);
    res.status(200).json({
      keyFigures,
      devisData,
      purchaseData,
      invoiceData,
      labData
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: 'Erreur lors de la mise à jour du modèle',
      description: "Erreur interne, Contactez l'administrateur"
    });
  }
});
module.exports = router;

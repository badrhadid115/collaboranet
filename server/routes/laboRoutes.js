const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { checkPermission, checkRole, upload } = require('../middleware');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const JSZip = require('jszip');
router.get('/reports', checkPermission('CanViewReports'), async (req, res) => {
  try {
    const { role_name, user_id } = req.user;

    let reports = await db
      .select([
        '*',
        db.raw(`
        CASE 
          WHEN '${role_name}' IN ('Lab Tech', 'Lab Resp') AND ${user_id} IN (
            file_fk_resp_id, file_fk_verif_id, file_fk_tech_id
          ) THEN true
          WHEN '${role_name}' NOT IN ('Lab Tech', 'Lab Resp') THEN true
          ELSE false
        END AS CanSeeLink
      `)
      ])
      .from('reports');

    reports = reports.map((report) => ({
      ...report,
      devis: report.devis ? JSON.parse(`[${report.devis}]`) : []
    }));

    res.status(200).json(reports);
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ message: 'An error occurred while fetching reports.' });
  }
});

router.post('/reports', checkPermission('CanPOSTReports'), async (req, res) => {
  const trx = await db.transaction();

  try {
    const { client_id, devis_id, file_id, report_date, report_type } = req.body;

    const nextReportId = await GetNextReportId();

    const [newReportId] = await trx('es_reports').insert({
      es_report_full_id: nextReportId,
      es_report_date: report_date,
      es_report_fk_client_id: client_id,
      es_report_fk_file_id: file_id,
      es_report_type: report_type
    });

    const reportDevisInserts = devis_id.map((devisId) => ({
      report_id: newReportId,
      devis_id: devisId
    }));

    await trx('es_report_devis').insert(reportDevisInserts);

    await trx('w_activity_log').insert({
      user_id: req.user.user_id,
      action: 'Rapport ajouté',
      details: `Le rapport ${nextReportId} a été ajouté par ${req.user.user_full_name}`,
      timestamp: new Date()
    });

    await trx.commit();

    res.status(201).json({
      success: 'Rapport ajouté avec succès',
      description: `Le rapport "${nextReportId}" a été ajouté avec succès.`,
      report_id: newReportId
    });
  } catch (err) {
    await trx.rollback();

    console.error('Error adding report:', err);
    res.status(500).json({
      error: "Erreur lors de l'ajout du rapport",
      description: "Erreur interne, contactez l'administrateur."
    });
  }
});
router.put('/reports/:report_id', checkPermission('CanPOSTReports'), async (req, res) => {
  const trx = await db.transaction();
  const { report_id } = req.params;

  try {
    const { client_id, devis_id, file_id, report_date, report_type } = req.body;
    const existingReport = await db('es_reports').select('es_report_full_id').where('es_report_id', report_id);
    if (existingReport.length === 0) {
      return res.status(404).json({
        error: 'Rapport non trouvé',
        description: "Le rapport spécifié n'existe pas"
      });
    }
    await trx('es_reports').where({ es_report_id: report_id }).update({
      es_report_date: report_date,
      es_report_fk_client_id: client_id,
      es_report_fk_file_id: file_id,
      es_report_type: report_type
    });

    await trx('es_report_devis').where({ report_id }).del();

    const reportDevisInserts = devis_id.map((devisId) => ({
      report_id,
      devis_id: devisId
    }));
    await trx('es_report_devis').insert(reportDevisInserts);
    await trx('w_activity_log').insert({
      user_id: req.user.user_id,
      action: 'Rapport mis à jour',
      details: `Le rapport ${existingReport[0].es_report_full_id} a été mis à jour par ${req.user.user_full_name}`,
      timestamp: new Date()
    });

    await trx.commit();

    res.status(200).json({
      success: 'Rapport mis à jour avec succès',
      description: `Le rapport "${existingReport[0].es_report_full_id}" a été mis à jour avec succès.`,
      report_id
    });
  } catch (err) {
    await trx.rollback();

    console.error('Error updating report:', err);
    res.status(500).json({
      error: 'Erreur lors de la mise à jour du rapport',
      description: "Erreur interne, contactez l'administrateur."
    });
  }
});

router.get('/samples', checkPermission('CanViewSamples'), async (req, res) => {
  try {
    const { role_name, user_id } = req.user;

    let samples = await db
      .select('*')
      .select(
        db.raw(`
          CASE 
            WHEN '${role_name}' IN ('Lab Tech', 'Lab Resp') AND ${user_id} IN (
              file_fk_resp_id, file_fk_verif_id, file_fk_tech_id
            ) THEN true
            ELSE true
          END AS CanSeeLink
        `)
      )
      .from('samples');

    res.status(200).json(samples);
  } catch (err) {
    res.status(500).json(err);
    console.error(err);
  }
});

router.get('/samples/:sampleId', checkPermission('CanViewSamples'), async (req, res) => {
  try {
    const { role_name, user_id } = req.user;
    const { sampleId } = req.params;

    const rawSamples = await db.raw(
      `
        SELECT
            es_samples.*,
            DATE_FORMAT(es_sample_date, '%d/%m/%Y') as sample_date,
            w_clients.client_name,
            w_users.user_full_name,
            es_files.es_file_full_id,
            (
              CASE
                WHEN '${role_name}' IN ('Lab Tech', 'Lab Resp') AND ${user_id} IN (
                  es_files.es_file_fk_resp_id,
                  es_files.es_file_fk_verif_id,
                  es_files.es_file_fk_tech_id
                ) THEN true
                WHEN '${role_name}' NOT IN ('Lab Tech', 'Lab Resp') THEN true
                ELSE false
              END
            ) AS CanSeeLink
        FROM
            es_samples
        LEFT JOIN
            w_clients ON es_samples.es_sample_fk_client_id = w_clients.client_id
        LEFT JOIN
            w_users ON es_samples.es_sample_fk_user_id = w_users.user_id
        LEFT JOIN
            es_files ON es_samples.es_sample_fk_file_id = es_files.es_file_id
        WHERE
            es_samples.es_sample_full_id = ?
        ORDER BY
            es_sample_id DESC;
      `,
      [sampleId]
    );

    const samples = rawSamples[0];

    res.status(200).json(samples[0]);
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});
router.get('/resp-list', async (req, res) => {
  try {
    const users = await db
      .select('w_users.user_id', 'w_users.user_full_name')
      .from('w_users')
      .where('user_role_id', 11)
      .orWhere('user_role_id', 4)
      .orWhere('user_role_id', 8)
      .orWhere('user_role_id', 5)
      .orderBy('user_full_name');
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});
router.get('/files-client/:id', async (req, res) => {
  try {
    const files = await db
      .select('es_file_id', 'es_file_full_id')
      .from('es_files')
      .where('es_file_fk_client_id', req.params.id)
      .orderBy('es_file_creation_time', 'desc');
    res.status(200).json(files);
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
        )
      )
      .from('co_devis')
      .where('devis_fk_client_id', req.params.id)
      .orderBy('devis_id', 'desc');
    res.status(200).json(devis);
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});
router.post('/samples', checkPermission('CanPOSTSamples'), upload.single('photo'), async (req, res) => {
  try {
    const sample = req.body;
    const picture = req.file;

    const nextId = await GetNextSampleId();

    const Image = fs.readFileSync(picture.path);
    const ImageBuffer = await sharp(Image).toBuffer();
    const picturePath = `./uploads/SamplePictures/${picture.filename}`;
    fs.writeFileSync(picturePath, ImageBuffer, 'binary');
    fs.unlinkSync(picture.path);

    await db('es_samples').insert({
      es_sample_full_id: nextId,
      es_sample_name: sample.sample_name.toUpperCase(),
      es_sample_date: sample.sample_date,
      es_sample_description: sample.description.toUpperCase(),
      es_sample_quantity: sample.quantity,
      es_sample_timestamp: new Date(),
      es_sample_fk_client_id: sample.client_id,
      es_sample_fk_file_id: sample.file_id,
      es_sample_fk_user_id: sample.user_id,
      es_sample_picture_path: `/uploads/SamplePictures/${picture.filename}`
    });
    await db('w_activity_log').insert({
      user_id: req.user.user_id,
      action: 'Echantillon ajouté',
      details: `Echantilon ${nextId} ajouté by ${req.user.user_full_name}`,
      timestamp: new Date()
    });

    res.status(200).json({
      success: 'Echantillon ajouté avec succès',
      description: `L'échantillon "${nextId}" a été ajouté avec succès.`
    });
  } catch (err) {
    res.status(500).json({
      error: "Erreur lors de l'ajout de l'échantillon",
      description: "Erreur interne, Contactez l'administrateur"
    });
    console.error(err);
  }
});
router.put('/samples/:id', checkPermission('CanPOSTSamples'), upload.single('photo'), async (req, res) => {
  const sampleId = req.params.id;
  try {
    const sample = req.body;
    const picture = req.file;

    if (picture) {
      const Image = fs.readFileSync(picture.path);
      const ImageBuffer = await sharp(Image).toBuffer();
      const picturePath = `./uploads/SamplePictures/${picture.filename}`;
      fs.writeFileSync(picturePath, ImageBuffer, 'binary');
      fs.unlinkSync(picture.path);

      await db('es_samples')
        .where('es_sample_id', sampleId)
        .update({
          es_sample_picture_path: `/uploads/SamplePictures/${picture.filename}`
        });
    }
    const existingSample = await db('es_samples').select('es_sample_full_id').where('es_sample_id', sampleId);
    if (existingSample.length === 0) {
      return res.status(404).json({
        error: 'Devis non trouvé',
        description: "Le devis spécifié n'existe pas"
      });
    }
    await db('es_samples').where('es_sample_id', sampleId).update({
      es_sample_name: sample.sample_name.toUpperCase(),
      es_sample_date: sample.sample_date,
      es_sample_description: sample.description.toUpperCase(),
      es_sample_quantity: sample.quantity,
      es_sample_fk_file_id: sample.file_id,
      es_sample_timestamp: new Date(),
      es_sample_fk_client_id: sample.client_id,
      es_sample_fk_user_id: sample.user_id
    });

    await db('w_activity_log').insert({
      user_id: req.user.user_id,
      action: 'Echantillon mis à jour',
      details: `Echantillon ${existingSample[0].es_sample_full_id} mis à jour par ${req.user.user_full_name}`,
      timestamp: new Date()
    });

    res.status(200).json({
      success: 'Echantillon mis à jour avec succès',
      description: `L'échantillon "${existingSample[0].es_sample_full_id}" a été mis à jour avec succès.`
    });
  } catch (err) {
    res.status(500).json({
      error: "Erreur lors de la mise à jour de l'échantillon",
      description: "Erreur interne, Contactez l'administrateur"
    });
    console.error(err);
  }
});
router.get('/files/:filter', checkPermission('CanViewFiles'), async (req, res) => {
  const { filter } = req.params;
  const { role_name, user_id } = req.user;
  const userRole = req.user.role_name;
  const userRoleDel = req.user.replacedUserRole;
  const userIdDel = req.user.replacedUserId;
  const userId = req.user.user_id;

  try {
    let filesQuery = db
      .select(
        'es_files.*',
        db.raw("DATE_FORMAT(es_files.es_file_creation_time, '%d/%m/%Y %H:%i:%s') as es_file_creation_time"),
        db.raw("DATE_FORMAT(es_files.es_file_opening_date, '%d/%m/%Y') as es_file_opening_date"),
        db.raw("DATE_FORMAT(es_files.es_file_intern_deadline, '%d/%m/%Y') as es_file_intern_deadline"),
        db.raw("DATE_FORMAT(es_files.es_file_extern_deadline, '%d/%m/%Y') as es_file_extern_deadline"),
        db.raw("DATE_FORMAT(es_files.es_file_exit_date, '%d/%m/%Y') as es_file_exit_date"),
        db.raw("DATE_FORMAT(es_files.es_file_closing_date, '%d/%m/%Y') as es_file_closing_date"),
        db.raw("DATE_FORMAT(es_files.es_file_submission_time, '%d/%m/%Y %H:%i:%s') as es_file_submission_time"),
        'es_file_statuses.status_name',
        'w_clients.client_name',
        'w_users1.user_full_name as resp_tech',
        'w_users2.user_full_name as tech',
        'w_users3.user_full_name as verif',
        'w_client_segment.segment_name',
        'w_types.type_name'
      )
      .from('es_files')
      .leftJoin('es_file_statuses', 'es_files.es_file_fk_status_id', 'es_file_statuses.status_id')
      .leftJoin('w_clients', 'es_files.es_file_fk_client_id', 'w_clients.client_id')
      .leftJoin('w_users as w_users1', 'es_files.es_file_fk_resp_id', 'w_users1.user_id')
      .leftJoin('w_users as w_users2', 'es_files.es_file_fk_tech_id', 'w_users2.user_id')
      .leftJoin('w_users as w_users3', 'es_files.es_file_fk_verif_id', 'w_users3.user_id')
      .leftJoin('w_client_segment', 'es_files.es_file_fk_segment_id', 'w_client_segment.segment_id')
      .leftJoin('w_types', 'es_files.es_file_fk_type_id', 'w_types.type_id');

    switch (filter) {
      case 'cancelled':
        filesQuery = filesQuery.where('es_files.es_file_fk_status_id', 0);
        break;
      case 'inprogress':
        filesQuery = filesQuery.whereBetween('es_files.es_file_fk_status_id', [1, 6]);
        break;
      case 'validated':
        filesQuery = filesQuery.whereBetween('es_files.es_file_fk_status_id', [7, 8]);
        break;
      case 'closed':
        filesQuery = filesQuery.where('es_files.es_file_fk_status_id', 9);
        break;
      case 'all':
        filesQuery = filesQuery.whereBetween('es_files.es_file_fk_status_id', [0, 9]);
        break;
      case 'incomplete':
        filesQuery = filesQuery.where('es_files.es_file_incomplete', 1);
        break;
      default:
        break;
    }
    if (userRole === 'Lab Resp' || userRole === 'Lab Tech') {
      const userIds = [userId];

      if (userIdDel) {
        userIds.push(userIdDel);
      }
      filesQuery = filesQuery.andWhere(function () {
        this.whereIn('es_file_fk_resp_id', userIds).orWhereIn('es_file_fk_tech_id', userIds).orWhereIn('es_file_fk_verif_id', userIds);
      });
    }

    if (filter === 'closed' || filter === 'all' || filter === 'validated') {
      filesQuery = await filesQuery.orderBy('es_file_intern_deadline', 'desc');
    } else {
      filesQuery = await filesQuery.orderBy('es_file_intern_deadline', 'asc');
    }
    if (filter === 'inprogress' || filter === 'all') {
      if (userRole === 'Lab Tech') {
        filesQuery.sort((a, b) => {
          if (a.es_file_error > b.es_file_error) {
            return -1;
          } else if (a.es_file_error < b.es_file_error) {
            return 1;
          } else {
            return a.es_file_fk_status_id - b.es_file_fk_status_id;
          }
        });
      } else if (userRole === 'Lab Resp') {
        filesQuery.sort((a, b) => {
          const statusPriority = {
            1: 1,
            3: 2
          };
          return (statusPriority[a.es_file_fk_status_id] || Infinity) - (statusPriority[b.es_file_fk_status_id] || Infinity);
        });
      } else if (userRole === 'General Manager') {
        filesQuery.sort((a, b) => {
          if (a.es_file_fk_status_id === 5 && b.es_file_fk_status_id !== 5) {
            return -1;
          } else if (a.es_file_fk_status_id !== 5 && b.es_file_fk_status_id === 5) {
            return 1;
          } else {
            return 0;
          }
        });
      } else if (userRole === 'Head Laboratory') {
        filesQuery.sort((a, b) => {
          if (a.es_file_fk_status_id === 4 && b.es_file_fk_status_id !== 4) {
            return -1;
          } else if (a.es_file_fk_status_id !== 4 && b.es_file_fk_status_id === 4) {
            return 1;
          } else {
            return 0;
          }
        });
      } else if (userRole === 'Head Sales') {
        filesQuery.sort((a, b) => {
          if (a.es_file_fk_status_id === 6 && b.es_file_fk_status_id !== 6) {
            return -1;
          } else if (a.es_file_fk_status_id !== 6 && b.es_file_fk_status_id === 6) {
            return 1;
          } else {
            return 0;
          }
        });
      }
    }
    filesQuery = await Promise.all(
      filesQuery.map(async (file) => {
        const [devis, samples, purchases, reports] = await Promise.all([
          fetchRelatedData('co_devis', 'devis_full_id', 'devis_fk_file_id', file.es_file_id),
          fetchRelatedData('es_samples', 'es_sample_name', 'es_sample_fk_file_id', file.es_file_id),
          fetchRelatedData('co_purchases', 'purchase_order_ref', 'purchase_fk_file_id', file.es_file_id),
          fetchRelatedData('es_reports', 'es_report_full_id', 'es_report_fk_file_id', file.es_file_id)
        ]);

        file.devis = devis.join(', ');
        file.samples = samples.join(', ');
        file.purchases = purchases.join(', ');
        file.reports = reports.join(', ');

        return file;
      })
    );

    res.status(200).json(filesQuery);
  } catch (err) {
    console.error('Error fetching files:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

async function fetchRelatedData(tableName, fieldToSelect, fieldToMatch, fileId) {
  const relatedData = await db(tableName).distinct(fieldToSelect).where(fieldToMatch, fileId);

  return relatedData.map((item) => item[fieldToSelect]);
}
router.get('/files-full/:id', checkPermission('CanViewFiles'), async (req, res) => {
  const userIdDel = req.user.replacedUserId;
  try {
    const file = await db
      .select(
        'es_files.*',
        db.raw("DATE_FORMAT(es_files.es_file_creation_time, '%d/%m/%Y %H:%i:%s') as es_file_creation_time"),
        db.raw("DATE_FORMAT(es_files.es_file_opening_date, '%d/%m/%Y') as es_file_opening_date"),
        db.raw("DATE_FORMAT(es_files.es_file_intern_deadline, '%d/%m/%Y') as es_file_intern_deadline"),
        db.raw("DATE_FORMAT(es_files.es_file_extern_deadline, '%d/%m/%Y') as es_file_extern_deadline"),
        db.raw("DATE_FORMAT(es_files.es_file_exit_date, '%d/%m/%Y') as es_file_exit_date"),
        db.raw("DATE_FORMAT(es_files.es_file_closing_date, '%d/%m/%Y') as es_file_closing_date"),
        db.raw("DATE_FORMAT(es_files.es_file_submission_time, '%d/%m/%Y %H:%i:%s') as es_file_submission_time"),
        'es_file_statuses.status_name',
        'w_clients.*',
        'w_users1.user_full_name as resp_tech',
        'w_users2.user_full_name as tech',
        'w_users3.user_full_name as verif',
        'w_client_segment.segment_name',
        'w_types.type_name'
      )
      .from('es_files')
      .leftJoin('es_file_statuses', 'es_files.es_file_fk_status_id', 'es_file_statuses.status_id')
      .leftJoin('w_clients', 'es_files.es_file_fk_client_id', 'w_clients.client_id')
      .leftJoin('w_users as w_users1', 'es_files.es_file_fk_resp_id', 'w_users1.user_id')
      .leftJoin('w_users as w_users2', 'es_files.es_file_fk_tech_id', 'w_users2.user_id')
      .leftJoin('w_users as w_users3', 'es_files.es_file_fk_verif_id', 'w_users3.user_id')
      .leftJoin('w_client_segment', 'es_files.es_file_fk_segment_id', 'w_client_segment.segment_id')
      .leftJoin('w_types', 'es_files.es_file_fk_type_id', 'w_types.type_id')
      .where('es_file_full_id', req.params.id);
    if (file.length === 0) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }
    const userRole = req.user.role_name;
    const userId = req.user.user_id;
    let userIds = [userId];
    if (userIdDel) {
      userIds.push(userIdDel);
    }
    if (userRole === 'Lab Resp' || userRole === 'Lab Tech') {
      if (
        !userIds.includes(file[0].es_file_fk_resp_id) &&
        !userIds.includes(file[0].es_file_fk_tech_id) &&
        !userIds.includes(file[0].es_file_fk_verif_id)
      ) {
        return res.status(403).json({
          error: 'Permission non accordée',
          message: "Vous n'avez pas la permission d'effectuer cette action"
        });
      }
    }
    const devis = await db('co_devis')
      .select(
        'devis_full_id',
        'devis_id',
        'devis_version',
        'devis_type',
        db.raw(
          "CONCAT(co_devis.devis_full_id, IF(co_devis.devis_version > 0, CONCAT('.V', co_devis.devis_version), '')) as devis_formatted_id"
        )
      )
      .where('devis_fk_file_id', file[0].es_file_id);
    const fetchDevisDetails = async (devis) => {
      const stDevisIds = devis.filter((d) => d.devis_type === 'ST').map((d) => d.devis_id);
      const ffDevisIds = devis.filter((d) => d.devis_type !== 'ST').map((d) => d.devis_id);

      const [stDetails, ffDetails] = await Promise.all([
        db('co_e_devis_elements')
          .select('*')
          .leftJoin('co_labtests', 'co_e_devis_elements.element_test_id', 'co_labtests.labtest_id')
          .leftJoin('co_methods', 'co_labtests.labtest_fk_method_id', 'co_methods.method_id')
          .whereIn('element_fk_devis_id', stDevisIds),
        db('co_ff_devis_elements').select('*').whereIn('element_fk_devis_id', ffDevisIds)
      ]);

      const stDetailsMap = stDetails.reduce((acc, detail) => {
        if (!acc[detail.element_fk_devis_id]) {
          acc[detail.element_fk_devis_id] = [];
        }
        acc[detail.element_fk_devis_id].push(detail);
        return acc;
      }, {});

      const ffDetailsMap = ffDetails.reduce((acc, detail) => {
        if (!acc[detail.element_fk_devis_id]) {
          acc[detail.element_fk_devis_id] = [];
        }
        acc[detail.element_fk_devis_id].push(detail);
        return acc;
      }, {});

      return devis.map((d) => {
        if (d.devis_type === 'ST') {
          d.details = stDetailsMap[d.devis_id] || [];
        } else {
          d.details = ffDetailsMap[d.devis_id] || [];
        }
        return d;
      });
    };

    const devisWithDetails = await fetchDevisDetails(devis);
    const purchases = await db('co_purchases')
      .select('*', db.raw("DATE_FORMAT(purchase_date, '%d/%m/%Y') as purchase_date"))
      .where('purchase_fk_file_id', file[0].es_file_id);
    const samples = await db('es_samples')
      .select('*', db.raw("DATE_FORMAT(es_sample_date, '%d/%m/%Y') as es_sample_date"))
      .where('es_sample_fk_file_id', file[0].es_file_id);
    const reports = await db('es_reports')
      .select('*', db.raw("DATE_FORMAT(es_report_date, '%d/%m/%Y') as es_report_date"))
      .where('es_report_fk_file_id', file[0].es_file_id);
    const comments = await db('es_files_dashboard')
      .select(
        'es_files_dashboard.*',
        db.raw("DATE_FORMAT(es_dashboard_timestamp, '%d/%m/%Y %H:%i:%s') as comment_date"),
        'w_users.user_full_name',
        'w_users.user_profile_pic'
      )
      .leftJoin('w_users', 'es_files_dashboard.es_dashboard_fk_user_id', 'w_users.user_id')
      .where('es_dashboard_fk_file_id', file[0].es_file_id)
      .orderBy('es_dashboard_timestamp', 'desc');
    const fetchUploadsForComments = async (comments) => {
      const commentIds = comments.map((comment) => comment.es_dashboard_id);

      const uploads = await db('es_files_dashboard_uploads').select('*').whereIn('es_dashboard_id', commentIds);

      const uploadsMap = uploads.reduce((acc, upload) => {
        if (!acc[upload.es_dashboard_id]) {
          acc[upload.es_dashboard_id] = [];
        }
        acc[upload.es_dashboard_id].push(upload);
        return acc;
      }, {});

      return comments.map((comment) => {
        comment.uploads = uploadsMap[comment.es_dashboard_id] || [];
        return comment;
      });
    };

    const commentsWithUploads = await fetchUploadsForComments(comments);
    const lastSubmission = commentsWithUploads.find(
      (comment) => (comment.es_dashboard_status === 3 || comment.es_dashboard_status === 4) && comment.uploads.length !== 0
    );

    const lastSubmissionWithUploads = lastSubmission
      ? {
          ...lastSubmission,
          uploads: lastSubmission.uploads
        }
      : null;
    const nextStep = await db('es_file_statuses').select('status_next_step').where('status_id', file[0].es_file_fk_status_id);
    const requiredPermission = await db('es_file_statuses')
      .select('permission_name')
      .leftJoin('w_permissions', 'es_file_statuses.status_fk_permission_id', 'w_permissions.permission_id')
      .where('status_id', nextStep[0].status_next_step)
      .andWhere('status_fk_permission_id' !== null);
    const fileDetails = {
      file: file[0],
      requiredPermission: requiredPermission[0].permission_name,
      devis: devisWithDetails,
      purchases: purchases,
      samples: samples,
      reports: reports,
      comments: commentsWithUploads,
      last_submission: lastSubmissionWithUploads
    };
    res.status(200).json(fileDetails);
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});
router.post('/files-comment', checkPermission('CanViewFiles'), upload.array('attachments'), async (req, res) => {
  try {
    const { body, files, user } = req;
    let { file_id, comment, mentionedUsers } = body;

    if (typeof mentionedUsers === 'string') {
      mentionedUsers = JSON.parse(mentionedUsers);
    }

    await db('es_files_dashboard').insert({
      es_dashboard_content: comment,
      es_dashboard_timestamp: new Date(),
      es_dashboard_status: 10,
      es_dashboard_fk_user_id: user.user_id,
      es_dashboard_fk_file_id: file_id
    });

    const [commentEntry] = await db('es_files_dashboard')
      .select('es_dashboard_id')
      .where({
        es_dashboard_fk_user_id: user.user_id,
        es_dashboard_fk_file_id: file_id
      })
      .orderBy('es_dashboard_timestamp', 'desc')
      .limit(1);

    const commentId = commentEntry.es_dashboard_id;

    if (files && files.length > 0) {
      const uploadPromises = files.map(async (file) => {
        const uploadFilePath = file.path.replace(/\\/g, '/');
        await db('es_files_dashboard_uploads').insert({
          es_dashboard_file_name: file.originalname,
          es_dashboard_filesize: file.size,
          es_dashboard_filepath: uploadFilePath.startsWith('/') ? uploadFilePath : `/${uploadFilePath}`,
          es_dashboard_id: commentId
        });
      });

      await Promise.all(uploadPromises);
    }

    const fileDetails = await db('es_files')
      .select('es_file_full_id')

      .where('es_file_id', file_id)
      .first();

    if (mentionedUsers && mentionedUsers.length > 0) {
      const link = `/dossiers/${fileDetails.es_file_full_id}/`;
      for (const username of mentionedUsers) {
        const mentionedUser = await db('w_users').select('user_id').where('user_username', username).first();

        if (mentionedUser) {
          sendNotificationAndEmail(
            mentionedUser.user_id,
            'Commentaire Mentionné',
            `${user.user_full_name} vous a mentionné dans un commentaire du dossier client "${fileDetails.es_file_full_id}}". Visitez la page du suivi devis pour le consulter.`,
            link,
            fileDetails.es_file_full_id
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
router.get('/download-files/:file_comment_id', async (req, res) => {
  try {
    const { file_comment_id } = req.params;
    const uploads = await db('es_files_dashboard_uploads')
      .select('es_dashboard_file_name', 'es_dashboard_filepath')
      .where('es_dashboard_id', file_comment_id);

    if (!uploads || uploads.length === 0) {
      return res.status(404).json({ error: 'No uploads found for the provided comment ID' });
    }
    const zip = new JSZip();
    uploads.forEach((upload) => {
      const filePath = path.join(__dirname, '..', upload.es_dashboard_filepath);
      const fileContent = fs.readFileSync(filePath);
      zip.file(upload.es_dashboard_file_name, fileContent);
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
router.get('/client-data/:id', checkPermission('CanPOSTFiles'), async (req, res) => {
  try {
    const clientId = req.params.id;

    const [purchases, samples, reports, devis] = await Promise.all([
      db.select('co_purchases.*').from('co_purchases').where('purchase_fk_client_id', clientId).orderBy('purchase_id', 'desc'),
      db.select('es_samples.*').from('es_samples').where('es_sample_fk_client_id', clientId).orderBy('es_sample_id', 'desc'),
      db.select('es_reports.*').from('es_reports').where('es_report_fk_client_id', clientId).orderBy('es_report_id', 'desc'),
      db
        .select(
          'co_devis.*',
          db.raw(
            "CONCAT(co_devis.devis_full_id, IF(co_devis.devis_version > 0, CONCAT('.V', co_devis.devis_version), '')) as devis_formatted_id"
          )
        )
        .from('co_devis')
        .where('co_devis.devis_fk_client_id', clientId)
        .orderBy('devis_id', 'desc')
    ]);
    const clientData = {
      purchases,
      samples,
      reports,
      devis
    };

    res.status(200).json(clientData);
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});
router.post('/files', checkPermission('CanPOSTFiles'), async (req, res) => {
  const trx = await db.transaction();

  try {
    const file = req.body;
    const nextId = await GetNextClientFileId();

    const [fileId] = await trx('es_files').insert({
      es_file_full_id: nextId,
      es_file_fk_status_id: 1,
      es_file_creation_time: new Date(),
      es_file_opening_date: file.opening_date,
      es_file_intern_deadline: file.intern_deadline,
      es_file_extern_deadline: file.extern_deadline,
      es_file_fk_client_id: file.client_id,
      es_file_fk_resp_id: file.resp_id,
      es_file_fk_segment_id: file.segment_id,
      es_file_fk_type_id: file.type_id
    });

    // Update related devis
    const devis = file.devis_id || [];
    for (const devisId of devis) {
      await trx('co_devis').where('devis_id', devisId).update({
        devis_fk_file_id: fileId,
        devis_fk_status: 8
      });
      await trx('co_devis_comments').insert({
        devis_comment_fk_devis_id: devisId,
        devis_comment_title: 'Dossier client créé',
        devis_comment_content: `Le dossier client ${nextId} a été créé par ${req.user.user_full_name}`,
        devis_comment_sent_time: new Date(),
        devis_comment_fk_user_id: req.user.user_id
      });
    }

    // Update related purchases
    const purchases = file.purchase_id || [];
    for (const purchaseId of purchases) {
      await trx('co_purchases').where('purchase_id', purchaseId).update({
        purchase_fk_file_id: fileId
      });
    }

    // Update related samples
    const samples = file.sample_id || [];
    for (const sampleId of samples) {
      await trx('es_samples').where('es_sample_id', sampleId).update({
        es_sample_fk_file_id: fileId
      });
    }

    // Update related reports
    const reports = file.report_id || [];
    for (const reportId of reports) {
      await trx('es_reports').where('es_report_id', reportId).update({
        es_report_fk_file_id: fileId
      });
    }

    // Log activity
    await trx('w_activity_log').insert({
      user_id: req.user.user_id,
      action: 'Dossier Client Saisi',
      details: `Dossier Client ${nextId} saisi par ${req.user.user_full_name}`,
      timestamp: new Date()
    });

    // Insert dashboard entry
    await trx('es_files_dashboard').insert({
      es_dashboard_title: 'Dossier client créé',
      es_dashboard_content: `Le dossier client ${nextId} a été créé par ${req.user.user_full_name}`,
      es_dashboard_status: 1,
      es_dashboard_timestamp: new Date(),
      es_dashboard_fk_file_id: fileId,
      es_dashboard_fk_user_id: req.user.user_id
    });

    const link = `/dossiers/${nextId}`;
    await sendNotificationAndEmail(
      file.resp_id,
      'Nouveau dossier client',
      `Vous avez un nouveau dossier client "${nextId}" à traiter. Visitez la page des dossiers pour plus de détails.`,
      link,
      nextId
    );

    await trx.commit();

    res.status(200).json({
      success: 'Dossier client ajouté avec succès',
      description: `Le dossier client "${nextId}" a été ajouté avec succès.`
    });
  } catch (err) {
    await trx.rollback();
    res.status(500).json({
      error: "Erreur lors de l'ajout du dossier client",
      description: "Erreur interne, Contactez l'administrateur"
    });
    console.error('Error adding client file:', err);
  }
});
router.get('/update-files/:fileId', checkPermission('CanPOSTFiles'), async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await db('es_files').where('es_file_full_id', fileId).first();

    if (!file) {
      return res.status(404).json({
        error: 'File not found',
        description: `No file found with ID ${fileId}`
      });
    }

    const devis = await db('co_devis')
      .where('devis_fk_file_id', file.es_file_id)
      .select(
        'devis_id',
        db.raw(
          "CONCAT(co_devis.devis_full_id, IF(co_devis.devis_version > 0, CONCAT('.V', co_devis.devis_version), '')) as devis_formatted_id"
        )
      );

    const purchases = await db('co_purchases').where('purchase_fk_file_id', file.es_file_id).select('purchase_id', 'purchase_order_ref');

    const samples = await db('es_samples')
      .where('es_sample_fk_file_id', file.es_file_id)
      .select('es_sample_id', 'es_sample_full_id', 'es_sample_name');

    const reports = await db('es_reports').where('es_report_fk_file_id', file.es_file_id).select('es_report_id', 'es_report_full_id');

    res.status(200).json({
      file,
      devis,
      purchases,
      samples,
      reports
    });
  } catch (err) {
    res.status(500).json({
      error: 'Error fetching file details',
      description: 'Internal server error, contact the administrator'
    });
    console.error('Error fetching file details:', err);
  }
});
router.put('/files/:fileFullId', checkPermission('CanPOSTFiles'), async (req, res) => {
  const trx = await db.transaction();

  try {
    const { fileFullId } = req.params;
    const file = req.body;

    // Fetch the primary key es_file_id using the provided es_file_full_id
    const fileRecord = await db('es_files').select('es_file_id').where('es_file_full_id', fileFullId).first();

    if (!fileRecord) {
      await trx.rollback();
      return res.status(404).json({
        error: 'File not found',
        description: `No file found with the full ID "${fileFullId}"`
      });
    }

    const { es_file_id } = fileRecord;

    // Update the file record
    await trx('es_files').where('es_file_id', es_file_id).update({
      es_file_opening_date: file.opening_date,
      es_file_intern_deadline: file.intern_deadline,
      es_file_extern_deadline: file.extern_deadline,
      es_file_fk_client_id: file.client_id,
      es_file_fk_resp_id: file.resp_id,
      es_file_fk_segment_id: file.segment_id,
      es_file_fk_type_id: file.type_id
    });

    // Update related devis
    const devis = file.devis_id || [];
    await trx('co_devis').where('devis_fk_file_id', es_file_id).update({
      devis_fk_file_id: null,
      devis_fk_status: 8
    });
    for (const devisId of devis) {
      await trx('co_devis').where('devis_id', devisId).update({
        devis_fk_file_id: es_file_id,
        devis_fk_status: 8
      });
    }

    // Update related purchases
    const purchases = file.purchase_id || [];
    await trx('co_purchases').where('purchase_fk_file_id', es_file_id).update({
      purchase_fk_file_id: null
    });
    for (const purchaseId of purchases) {
      await trx('co_purchases').where('purchase_id', purchaseId).update({
        purchase_fk_file_id: es_file_id
      });
    }

    // Update related samples
    const samples = file.sample_id || [];
    await trx('es_samples').where('es_sample_fk_file_id', es_file_id).update({
      es_sample_fk_file_id: null
    });
    for (const sampleId of samples) {
      await trx('es_samples').where('es_sample_id', sampleId).update({
        es_sample_fk_file_id: es_file_id
      });
    }

    // Update related reports
    const reports = file.report_id || [];
    await trx('es_reports').where('es_report_fk_file_id', es_file_id).update({
      es_report_fk_file_id: null
    });
    for (const reportId of reports) {
      await trx('es_reports').where('es_report_id', reportId).update({
        es_report_fk_file_id: es_file_id
      });
    }
    // Log activity
    await trx('w_activity_log').insert({
      user_id: req.user.user_id,
      action: 'Dossier Client Modifié',
      details: `Dossier Client ${fileFullId} modifié par ${req.user.user_full_name}`,
      timestamp: new Date()
    });

    // Insert dashboard entry
    await trx('es_files_dashboard').insert({
      es_dashboard_title: 'Dossier client modifié',
      es_dashboard_content: `Le dossier client ${fileFullId} a été modifié par ${req.user.user_full_name}`,
      es_dashboard_status: 1,
      es_dashboard_timestamp: new Date(),
      es_dashboard_fk_file_id: es_file_id,
      es_dashboard_fk_user_id: req.user.user_id
    });
    await trx.commit();

    res.status(200).json({
      success: 'Dossier client mis à jour avec succès',
      description: `Le dossier client "${fileFullId}" a été mis à jour avec succès.`
    });
  } catch (err) {
    await trx.rollback();
    res.status(500).json({
      error: 'Erreur lors de la mise à jour du dossier client',
      description: "Erreur interne, Contactez l'administrateur"
    });
    console.error('Error updating client file:', err);
  }
});
router.get('/techs/', checkRole('Lab Resp'), async (req, res) => {
  try {
    const techniciensQuery = db
      .distinct('es_tech_list.tech_fk_user_id', 'w_users.user_full_name', 'es_resp_list.resp_id')
      .from('es_tech_list')
      .leftJoin('w_users', 'es_tech_list.tech_fk_user_id', 'w_users.user_id')
      .leftJoin('es_resp_list', 'es_tech_list.tech_fk_resp_id', 'es_resp_list.resp_id')
      .where(function () {
        this.where('es_resp_list.resp_fk_user_id', req.user.user_id);
        if (req.user?.replacedUserId) {
          this.orWhere('es_resp_list.resp_fk_user_id', req.user.replacedUserId);
        }
      })
      .orderBy('w_users.user_full_name', 'asc');

    const techniciens = await techniciensQuery;

    const uniqueTechniciens = techniciens.reduce((acc, current) => {
      const x = acc.find((item) => item.tech_fk_user_id === current.tech_fk_user_id);
      if (!x) {
        return acc.concat([current]);
      } else {
        return acc;
      }
    }, []);

    const techniciensLabels = uniqueTechniciens.map((technicien) => {
      return {
        label: technicien.user_full_name,
        value: technicien.tech_fk_user_id
      };
    });

    res.status(200).json(techniciensLabels);
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});
router.post('/file-affect/:id', checkRole('Lab Resp'), async (req, res) => {
  const trx = await db.transaction();

  try {
    const { id } = req.params;
    const file = req.body;

    const fileDetails = await trx('es_files').select('*').where('es_file_id', id).forUpdate();

    if (fileDetails.length === 0) {
      await trx.rollback();
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }

    if (
      (fileDetails[0].es_file_fk_resp_id !== req.user.user_id && fileDetails[0].es_file_fk_resp_id !== req.user.replacedUserId) ||
      ![1, 2].includes(fileDetails[0].es_file_fk_status_id)
    ) {
      await trx.rollback();
      return res.status(403).json({
        error: 'Permission non accordée',
        description: "Vous n'avez pas la permission d'effectuer cette action"
      });
    }

    const currentTech = fileDetails[0].es_file_fk_tech_id;
    const currentVerif = fileDetails[0].es_file_fk_verif_id;
    const newTech = file.tech_id;
    const newVerif = file.verif_id !== undefined && file.verif_id !== null ? file.verif_id : req.user.user_id;

    await trx('es_files').where('es_file_id', id).update({
      es_file_fk_tech_id: newTech,
      es_file_fk_verif_id: newVerif,
      es_file_fk_status_id: 2
    });

    await trx('w_activity_log').insert({
      user_id: req.user.user_id,
      action: 'Dossier Affecté',
      details: `Dossier ${fileDetails[0].es_file_full_id} affecté par ${req.user.user_full_name}`,
      timestamp: new Date()
    });

    await trx('es_files_dashboard').insert({
      es_dashboard_title: `Dossier client ${fileDetails[0].es_file_fk_status_id === 1 ? 'affecté' : 'réaffecté'}`,
      es_dashboard_content: `Le dossier client ${fileDetails[0].es_file_full_id} a été affecté par ${req.user.user_full_name}`,
      es_dashboard_status: 2,
      es_dashboard_timestamp: new Date(),
      es_dashboard_fk_file_id: fileDetails[0].es_file_id,
      es_dashboard_fk_user_id: req.user.user_id
    });

    const link = `/dossiers/${fileDetails[0].es_file_full_id}`;
    sendNotificationAndEmail(
      newTech,
      'Dossier affecté',
      `${req.user.user_full_name} vous a affecté le dossier comme technicien responsable pour le dossier ${fileDetails[0].es_file_full_id}`,
      link,
      fileDetails[0].es_file_full_id
    );

    if (newVerif !== req.user.user_id) {
      sendNotificationAndEmail(
        newVerif,
        'Dossier affecté',
        `${req.user.user_full_name} vous a affecté le dossier comme vérificateur pour le dossier ${fileDetails[0].es_file_full_id}`,
        link,
        fileDetails[0].es_file_full_id
      );
    }

    if (currentTech !== newTech && currentTech !== null) {
      sendNotificationAndEmail(
        currentTech,
        'Dossier désaffecté',
        `${req.user.user_full_name} vous a désaffecté le dossier ${fileDetails[0].es_file_full_id}`,
        link,
        fileDetails[0].es_file_full_id
      );
    }

    if (currentVerif !== newVerif && currentVerif !== null && newVerif !== req.user.user_id) {
      sendNotificationAndEmail(
        currentVerif,
        'Dossier désaffecté',
        `${req.user.user_full_name} vous a désaffecté le dossier ${fileDetails[0].es_file_full_id}`,
        link,
        fileDetails[0].es_file_full_id
      );
    }

    await trx.commit();

    res.status(200).json({
      success: 'Dossier client affecté avec succès',
      description: `Le dossier client "${fileDetails[0].es_file_full_id}" a été affecté avec succès.`
    });
  } catch (err) {
    await trx.rollback();
    console.error('Error during file affectation:', err);
    res.status(500).json({
      error: "Erreur lors de l'affectation du dossier client",
      description: "Erreur interne, Contactez l'administrateur"
    });
  }
});
router.post('/files-submit', checkRole('Lab Tech'), upload.array('attachments'), async (req, res) => {
  const trx = await db.transaction();
  try {
    const fileId = req.body.file_id;
    const comment = req.body.comment || '';
    let mentionedUsers = req.body.mentionedUsers;
    if (typeof mentionedUsers === 'string') {
      mentionedUsers = JSON.parse(mentionedUsers);
    }
    const fileDetails = await trx('es_files').select('*').where('es_file_id', fileId).forUpdate();

    if (fileDetails.length === 0) {
      await trx.rollback();
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }
    if (
      (fileDetails[0].es_file_fk_tech_id !== req.user.user_id && fileDetails[0].es_file_fk_verif_id !== req.user.user_id) ||
      fileDetails[0].es_file_fk_status_id < 1 ||
      fileDetails[0].es_file_fk_status_id > 8
    ) {
      await trx.rollback();
      return res.status(403).json({
        error: 'Permission non accordée',
        message: "Vous n'avez pas la permission d'effectuer cette action"
      });
    }

    const uploads = req.files;
    const folderPath = `./uploads/ClientFilesUploads/${fileDetails[0].es_file_full_id}`;

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    uploads.forEach((upload) => {
      const oldPath = upload.path;
      const newPath = `${folderPath}/${upload.filename}`;
      fs.renameSync(oldPath, newPath);
    });
    await trx('es_files').where('es_file_id', fileId).update({
      es_file_fk_status_id: 3,
      es_file_submission_time: new Date(),
      es_file_error: 0
    });
    const AddedComment = await trx('es_files_dashboard').insert({
      es_dashboard_title: `Dossier client ${fileDetails[0].es_file_fk_status_id === 2 ? 'soumis' : 'ré-soumis'}`,
      es_dashboard_content: comment ? comment : '',
      es_dashboard_status: 3,
      es_dashboard_timestamp: new Date(),
      es_dashboard_fk_file_id: fileDetails[0].es_file_id,
      es_dashboard_fk_user_id: req.user.user_id
    });

    await Promise.all(
      uploads.map(async (upload) => {
        const filePath = `${folderPath}/${upload.filename}`.replace(/^\./, '');
        await trx('es_files_dashboard_uploads').insert({
          es_dashboard_id: AddedComment[0],
          es_dashboard_filepath: filePath,
          es_dashboard_file_name: upload.originalname,
          es_dashboard_filesize: upload.size
        });
      })
    );

    await trx('w_activity_log').insert({
      user_id: req.user.user_id,
      action: 'Dossier Soumis',
      details: `Dossier ${fileDetails[0].es_file_full_id} soumis par ${req.user.user_full_name}`,
      timestamp: new Date()
    });

    const link = `/dossiers/${fileDetails[0].es_file_full_id}`;
    sendNotificationAndEmail(
      fileDetails[0].es_file_fk_resp_id,
      `Dossier ${fileDetails[0].es_file_fk_status_id === 2 ? 'soumis' : 'ré-soumis'}`,
      `${req.user.user_full_name} a ${fileDetails[0].es_file_fk_status_id === 2 ? 'soumis' : 'ré-soumis'} le dossier ${
        fileDetails[0].es_file_full_id
      }, Visitez la page des dossiers client pour le consulter`,
      link,
      fileDetails[0].es_file_full_id
    );
    if (mentionedUsers && mentionedUsers.length > 0) {
      const link = `/dossiers/${fileDetails.es_file_full_id}/`;
      for (const username of mentionedUsers) {
        const mentionedUser = await db('w_users').select('user_id').where('user_username', username).first();

        if (mentionedUser) {
          sendNotificationAndEmail(
            mentionedUser.user_id,
            'Commentaire Mentionné',
            `${req.user.user_full_name} vous a mentionné dans un commentaire du dossier client "${fileDetails.es_file_full_id}". Visitez la page du suivi devis pour le consulter.`,
            link,
            fileDetails.es_file_full_id
          );
        }
      }
    }
    await trx.commit();

    res.status(200).json({
      success: 'Dossier client soumis avec succès',
      message: `Le dossier client "${fileDetails[0].es_file_full_id}" a été soumis avec succès.`
    });
  } catch (err) {
    await trx.rollback();
    console.error('Error submitting client file:', err);
    res.status(500).json({
      error: 'Erreur lors de la soumission du dossier client',
      message: "Erreur interne, Contactez l'administrateur"
    });
  }
});
const findNextStepAndAvailableUser = async (currentStepId, trx) => {
  const nextStep = await trx('es_file_statuses').select('status_id', 'status_next_step').where('status_id', currentStepId).first();

  if (!nextStep) {
    throw new Error('Next step not found');
  }
  const nextStepUpdate = nextStep.status_id;
  const nextStepId = nextStep.status_next_step;
  const nextStepDetails = await trx('es_file_statuses')
    .select('status_long_name', 'status_fk_permission_id')
    .where('status_id', nextStepId)
    .first();

  if (!nextStepDetails) {
    throw new Error('Next step details not found');
  }
  if (nextStepDetails.status_fk_permission_id === null) {
    return {
      nextStepUpdate,
      nextStepId,
      nextStepName: nextStepDetails.status_long_name,
      availableUsers: []
    };
  }
  const requiredPermission = await trx('w_permissions')
    .select('permission_name')
    .where('permission_id', nextStepDetails.status_fk_permission_id)
    .first();

  if (!requiredPermission) {
    throw new Error('Required permission not found');
  }

  const availableUsers = await trx('w_users')
    .select('user_id')
    .leftJoin('w_roles', 'w_users.user_role_id', 'w_roles.role_id')
    .leftJoin('w_rp_mapping', 'w_roles.role_id', 'w_rp_mapping.rp_role_id')
    .where('rp_permission_id', nextStepDetails.status_fk_permission_id)
    .andWhere('user_is_absent', false);

  if (availableUsers.length > 0) {
    return {
      nextStepUpdate,
      nextStepId,
      nextStepName: nextStepDetails.status_long_name,
      availableUsers
    };
  }

  return await findNextStepAndAvailableUser(nextStepId, trx);
};

router.post('/files-validate', upload.array('attachments'), async (req, res) => {
  const trx = await db.transaction();

  try {
    const { file_id: fileId, decision, comment } = req.body;
    let { mentionedUsers } = req.body;
    if (typeof mentionedUsers === 'string') {
      mentionedUsers = JSON.parse(mentionedUsers);
    }
    const uploads = req.files;

    const fileDetails = await trx('es_files').select('*').where('es_file_id', fileId).first();

    if (!fileDetails) {
      await trx.rollback();
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }
    //Verifiying the permission of the user
    const nextStep = await trx('es_file_statuses').select('status_next_step').where('status_id', fileDetails.es_file_fk_status_id).first();
    if (!nextStep) {
      await trx.rollback();
      return res.status(500).json({ error: 'Next step not found' });
    }
    const nextStepName = await trx('es_file_statuses').select('status_long_name').where('status_id', nextStep.status_next_step).first();
    if (!nextStepName) {
      await trx.rollback();
      return res.status(500).json({ error: 'Next step name not found' });
    }

    const requiredPermission = await trx('es_file_statuses')
      .select('permission_name')
      .leftJoin('w_permissions', 'es_file_statuses.status_fk_permission_id', 'w_permissions.permission_id')
      .where('status_id', nextStep.status_next_step)
      .whereNotNull('status_fk_permission_id')
      .first();
    if (!requiredPermission) {
      await trx.rollback();
      return res.status(500).json({ error: 'Required permission not found' });
    }

    if (!req.user.permissions.includes(requiredPermission.permission_name)) {
      await trx.rollback();
      return res.status(403).json({
        error: 'Permission non accordée',
        message: "Vous n'avez pas la permission d'effectuer cette action"
      });
    }
    //Done Verifiying
    const nextStepData = await findNextStepAndAvailableUser(nextStep.status_next_step, trx);
    const folderPath = `./uploads/ClientFilesUploads/${fileDetails.es_file_full_id}`;
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    uploads.forEach((upload) => {
      const oldPath = upload.path;
      const newPath = `${folderPath}/${upload.filename}`;
      fs.renameSync(oldPath, newPath);
    });

    if (decision === 'refuse') {
      await trx('es_files').where('es_file_id', fileId).update({
        es_file_error: 1
      });

      const [addedCommentId] = await trx('es_files_dashboard').insert({
        es_dashboard_title: 'Dossier client refusé',
        es_dashboard_content: comment || '',
        es_dashboard_status: 5,
        es_dashboard_timestamp: new Date(),
        es_dashboard_fk_file_id: fileDetails.es_file_id,
        es_dashboard_fk_user_id: req.user.user_id
      });

      await Promise.all(
        uploads.map(async (upload) => {
          const filePath = `${folderPath}/${upload.filename}`.replace(/^\./, '');
          await trx('es_files_dashboard_uploads').insert({
            es_dashboard_id: addedCommentId,
            es_dashboard_filepath: filePath,
            es_dashboard_file_name: upload.originalname,
            es_dashboard_filesize: upload.size
          });
        })
      );

      await trx('w_activity_log').insert({
        user_id: req.user.user_id,
        action: 'Dossier Client Refusé',
        details: `Dossier ${fileDetails.es_file_full_id} refusé par ${req.user.user_full_name}`,
        timestamp: new Date()
      });

      const link = `/dossiers/${fileDetails.es_file_full_id}`;
      sendNotificationAndEmail(
        fileDetails.es_file_fk_tech_id,
        'Dossier refusé',
        `${req.user.user_full_name} a refusé le dossier ${fileDetails.es_file_full_id}. Visitez la page des dossiers client pour le consulter.`,
        link,
        fileDetails.es_file_full_id
      );

      if (mentionedUsers && mentionedUsers.length > 0) {
        await Promise.all(
          mentionedUsers.map(async (username) => {
            const mentionedUser = await trx('w_users').select('user_id').where('user_username', username).first();

            if (mentionedUser) {
              sendNotificationAndEmail(
                mentionedUser.user_id,
                'Commentaire Mentionné',
                `${req.user.user_full_name} vous a mentionné dans un commentaire du dossier client "${fileDetails.es_file_full_id}". Visitez la page du suivi devis pour le consulter.`,
                link,
                fileDetails.es_file_full_id
              );
            }
          })
        );
      }

      await trx.commit();
      return res.status(200).json({
        success: 'Dossier client refusé avec succès',
        message: `Le dossier client "${fileDetails.es_file_full_id}" a été refusé avec succès.`
      });
    } else if (decision === 'accept') {
      await trx('es_files').where('es_file_id', fileId).update({
        es_file_fk_status_id: nextStepData.nextStepUpdate,
        es_file_error: 0
      });

      const [addedCommentId] = await trx('es_files_dashboard').insert({
        es_dashboard_title: nextStepName.status_long_name,
        es_dashboard_content: comment || '',
        es_dashboard_status: 4,
        es_dashboard_timestamp: new Date(),
        es_dashboard_fk_file_id: fileDetails.es_file_id,
        es_dashboard_fk_user_id: req.user.user_id
      });

      await Promise.all(
        uploads.map(async (upload) => {
          const filePath = `${folderPath}/${upload.filename}`.replace(/^\./, '');
          await trx('es_files_dashboard_uploads').insert({
            es_dashboard_id: addedCommentId,
            es_dashboard_filepath: filePath,
            es_dashboard_file_name: upload.originalname,
            es_dashboard_filesize: upload.size
          });
        })
      );

      await trx('w_activity_log').insert({
        user_id: req.user.user_id,
        action: 'Dossier validé',
        details: `Dossier ${fileDetails.es_file_full_id} validé par ${req.user.user_full_name}`,
        timestamp: new Date()
      });

      const link = `/dossiers/${fileDetails.es_file_full_id}`;
      sendNotificationAndEmail(
        fileDetails.es_file_fk_tech_id,
        'Dossier validé',
        `${req.user.user_full_name} a validé le dossier ${fileDetails.es_file_full_id}. Visitez la page des dossiers client pour le consulter.`,
        link,
        fileDetails.es_file_full_id
      );

      const nextStepAfterValidation = await trx('es_file_statuses')
        .select('status_next_step')
        .where('status_id', nextStepData.nextStepUpdate)
        .first();
      if (!nextStepAfterValidation) {
        await trx.rollback();
        return res.status(500).json({ error: 'Next step after validation not found' });
      }

      const nextStepPermission = await trx('es_file_statuses')
        .select('permission_id')
        .leftJoin('w_permissions', 'es_file_statuses.status_fk_permission_id', 'w_permissions.permission_id')
        .where('status_id', nextStepAfterValidation.status_next_step)
        .whereNotNull('status_fk_permission_id')
        .first();
      if (nextStepPermission) {
        const nextStepUsers = await trx('w_users')
          .select('user_id')
          .leftJoin('w_roles', 'w_users.user_role_id', 'w_roles.role_id')
          .leftJoin('w_rp_mapping', 'w_roles.role_id', 'w_rp_mapping.rp_role_id')
          .where('rp_permission_id', nextStepPermission.permission_id);
        await Promise.all(
          nextStepUsers.map((user) => {
            sendNotificationAndEmail(
              user.user_id,
              'Nouveau dossier',
              `${req.user.user_full_name} a validé le dossier ${fileDetails.es_file_full_id}. Visitez la page des dossiers client pour le consulter.`,
              link,
              fileDetails.es_file_full_id
            );
          })
        );
      }
      if (mentionedUsers && mentionedUsers.length > 0) {
        await Promise.all(
          mentionedUsers.map(async (username) => {
            const mentionedUser = await trx('w_users').select('user_id').where('user_username', username).first();

            if (mentionedUser) {
              sendNotificationAndEmail(
                mentionedUser.user_id,
                'Commentaire Mentionné',
                `${req.user.user_full_name} vous a mentionné dans un commentaire du dossier client "${fileDetails.es_file_full_id}". Visitez la page du suivi devis pour le consulter.`,
                link,
                fileDetails.es_file_full_id
              );
            }
          })
        );
      }

      await trx.commit();
      return res.status(200).json({
        success: 'Dossier client validé avec succès',
        message: `Le dossier client "${fileDetails.es_file_full_id}" a été validé avec succès.`
      });
    } else {
      await trx.rollback();
      return res.status(500).json({
        error: 'Erreur lors de la validation du dossier client',
        message: "Erreur interne, Contactez l'administrateur"
      });
    }
  } catch (err) {
    await trx.rollback();
    console.error('Error validating file:', err);
    return res.status(500).json({
      error: 'Erreur lors de la validation du dossier client',
      message: "Erreur interne, Contactez l'administrateur"
    });
  }
});
//Cancel Client File
router.put('/files-cancel', checkPermission('CanCancelFiles'), async (req, res) => {
  try {
    const fileId = req.body.file_id;
    const fileDetails = await db('es_files').select('*').where('es_file_id', fileId);
    if (fileDetails.length === 0) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }
    if (fileDetails[0].es_file_fk_status_id > 8 || fileDetails[0].es_file_fk_status_id < 1) {
      return res.status(403).json({
        error: 'Permission non accordée',
        message: "Vous n'avez pas la permission d'effectuer cette action"
      });
    }
    await db('es_files').where('es_file_id', fileId).update({
      es_file_fk_status_id: 0
    });
    await db('es_files_dashboard').insert({
      es_dashboard_title: 'Dossier client annulé',
      es_dashboard_content: `Le dossier client ${fileDetails[0].es_file_full_id} a été annulé par ${req.user.user_full_name}`,
      es_dashboard_status: 12,
      es_dashboard_timestamp: new Date(),
      es_dashboard_fk_file_id: fileDetails[0].es_file_id,
      es_dashboard_fk_user_id: req.user.user_id
    });
    await db('w_activity_log').insert({
      user_id: req.user.user_id,
      action: 'Client file canceled',
      details: `Client file ${fileDetails[0].es_file_full_id} canceled by ${req.user.user_full_name}`,
      timestamp: new Date()
    });
    const link = `/dossiers/${fileDetails[0].es_file_full_id}`;
    sendNotificationAndEmail(
      fileDetails[0].es_file_fk_resp_id,
      'Dossier annulé',
      `${req.user.user_full_name} a annulé le dossier ${fileDetails[0].es_file_full_id}, Visitez la page des dossiers client pour le consulter`,
      link,
      fileDetails[0].es_file_full_id
    );
    res.status(200).json({
      success: 'Dossier client annulé avec succès',
      message: `Le dossier client "${fileDetails[0].es_file_full_id}" a été annulé avec succès.`
    });
  } catch (err) {
    res.status(500).json({
      error: "Erreur lors de l'annulation du dossier client",
      message: "Erreur interne, Contactez l'administrateur"
    });
    console.log(err);
  }
});
router.put('/files-checkout', checkPermission('CanPOSTFiles'), async (req, res) => {
  try {
    const fileId = req.body.file_id;
    const fileDetails = await db('es_files').select('*').where('es_file_id', fileId);
    if (fileDetails.length === 0) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }
    if (fileDetails[0].es_file_fk_status_id < 1 || fileDetails[0].es_file_fk_status_id > 8) {
      return res.status(403).json({
        error: 'Permission non accordée',
        message: "Vous n'avez pas la permission d'effectuer cette action"
      });
    }
    await db('es_files').where('es_file_id', fileId).update({
      es_file_fk_status_id: 8,
      es_file_exit_date: new Date()
    });
    await db('es_files_dashboard').insert({
      es_dashboard_title: 'Dossier client sorti',
      es_dashboard_content: `Le dossier client ${fileDetails[0].es_file_full_id} a été marqué comme sorti par ${req.user.user_full_name}`,
      es_dashboard_status: 9,
      es_dashboard_timestamp: new Date(),
      es_dashboard_fk_file_id: fileDetails[0].es_file_id,
      es_dashboard_fk_user_id: req.user.user_id
    });
    await db('w_activity_log').insert({
      user_id: req.user.user_id,
      action: 'Client file checked out',
      details: `Client file ${fileDetails[0].es_file_full_id} checked out by ${req.user.user_full_name}`,
      timestamp: new Date()
    });
    res.status(200).json({
      success: 'Dossier client marqué comme sorti avec succès',
      message: `Le dossier client "${fileDetails[0].es_file_full_id}" a été marqué comme sorti avec succès.`
    });
  } catch (err) {
    res.status(500).json({
      error: 'Erreur lors de la sortie du dossier client',
      message: "Erreur interne, Contactez l'administrateur"
    });
    console.log(err);
  }
});
//Mark the file as closed
router.put('/files-close', checkPermission('CanPOSTFiles'), async (req, res) => {
  try {
    const fileId = req.body.file_id;
    const fileDetails = await db('es_files').select('*').where('es_file_id', fileId);
    if (fileDetails.length === 0) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }
    if (fileDetails[0].es_file_fk_status_id !== 8) {
      return res.status(403).json({
        error: 'Permission non accordée',
        message: "Vous n'avez pas la permission d'effectuer cette action"
      });
    }
    await db('es_files').where('es_file_id', fileId).update({
      es_file_fk_status_id: 9,
      es_file_closing_date: new Date()
    });
    await db('es_files_dashboard').insert({
      es_dashboard_title: 'Dossier client clôturé',
      es_dashboard_content: `Le dossier client ${fileDetails[0].es_file_full_id} a été marqué comme clôturé par ${req.user.user_full_name}`,
      es_dashboard_status: 10,
      es_dashboard_timestamp: new Date(),
      es_dashboard_fk_file_id: fileDetails[0].es_file_id,
      es_dashboard_fk_user_id: req.user.user_id
    });
    await db('w_activity_log').insert({
      user_id: req.user.user_id,
      action: 'Client file closed',
      details: `Client file ${fileDetails[0].es_file_full_id} closed by ${req.user.user_full_name}`,
      timestamp: new Date()
    });
    res.status(200).json({
      success: 'Dossier client marqué comme clôturé avec succès',
      message: `Le dossier client "${fileDetails[0].es_file_full_id}" a été marqué comme clôturé avec succès.`
    });
  } catch (err) {
    res.status(500).json({
      error: 'Erreur lors de la clôture du dossier client',
      message: "Erreur interne, Contactez l'administrateur"
    });
    console.log(err);
  }
});
router.put('/files-reopen', checkPermission('CanPOSTFiles'), async (req, res) => {
  try {
    const fileId = req.body.file_id;
    const intern_deadline = req.body.intern_deadline;
    const extern_deadline = req.body.extern_deadline;
    const fileDetails = await db('es_files').select('*').where('es_file_id', fileId);
    if (fileDetails.length === 0) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }
    if (fileDetails[0].es_file_fk_status_id !== 0 && fileDetails[0].es_file_fk_status_id !== 9) {
      return res.status(403).json({
        error: 'Permission non accordée',
        message: "Vous n'avez pas la permission d'effectuer cette action"
      });
    }
    await db('es_files').where('es_file_id', fileId).update({
      es_file_fk_status_id: 2,
      es_file_intern_deadline: intern_deadline,
      es_file_extern_deadline: extern_deadline
    });
    await db('es_files_dashboard').insert({
      es_dashboard_title: 'Dossier client ré-ouvert',
      es_dashboard_content: `Le dossier client ${fileDetails[0].es_file_full_id} a été ré-ouvert par ${req.user.user_full_name}`,
      es_dashboard_status: 11,
      es_dashboard_timestamp: new Date(),
      es_dashboard_fk_file_id: fileDetails[0].es_file_id,
      es_dashboard_fk_user_id: req.user.user_id
    });
    await db('w_activity_log').insert({
      user_id: req.user.user_id,
      action: 'Client file reopened',
      details: `Client file ${fileDetails[0].es_file_full_id} reopened by ${req.user.user_full_name}`,
      timestamp: new Date()
    });
    const link = `/dossiers/${fileDetails[0].es_file_full_id}`;
    sendNotificationAndEmail(
      fileDetails[0].es_file_fk_resp_id,
      'Dossier ré-ouvert',
      `${req.user.user_full_name} a ré-ouvert le dossier ${fileDetails[0].es_file_full_id}, Visitez la page des dossiers client pour le consulter`,
      link,
      fileDetails[0].es_file_full_id
    );
    res.status(200).json({
      success: 'Dossier client ré-ouvert avec succès',
      message: `Le dossier client "${fileDetails[0].es_file_full_id}" a été ré-ouvert avec succès.`
    });
  } catch (err) {
    res.status(500).json({
      error: 'Erreur lors de la ré-ouverture du dossier client',
      message: "Erreur interne, Contactez l'administrateur"
    });
    console.log(err);
  }
});
router.post('/files-incomplete', checkPermission('CanPOSTFiles'), async (req, res) => {
  try {
    const fileId = req.body.file_id;
    const comment = req.body.comment || '';
    const fileDetails = await db('es_files').select('*').where('es_file_id', fileId);
    if (fileDetails.length === 0) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }
    if (fileDetails[0].es_file_incomplete === 1) {
      return res.status(409).json({ error: 'Dossier déjà marqué comme incomplet' });
    }
    await db('es_files')
      .where('es_file_id', fileId)
      .update({
        es_file_incomplete: 1,
        es_file_incomplete_comment: comment || ''
      });
    await db('es_files_dashboard').insert({
      es_dashboard_title: 'Dossier client incomplet',
      es_dashboard_content: `Le dossier client ${fileDetails[0].es_file_full_id} a été marqué comme incomplet par ${req.user.user_full_name}; Commentaire: ${comment}`,
      es_dashboard_status: 13,
      es_dashboard_timestamp: new Date(),
      es_dashboard_fk_file_id: fileDetails[0].es_file_id,
      es_dashboard_fk_user_id: req.user.user_id
    });
    await db('w_activity_log').insert({
      user_id: req.user.user_id,
      action: 'Client file marked as incomplete',
      details: `Client file ${fileDetails[0].es_file_full_id} marked as incomplete by ${req.user.user_full_name}`,
      timestamp: new Date()
    });
    const link = `/dossiers/${fileDetails[0].es_file_full_id}`;
    sendNotificationAndEmail(
      fileDetails[0].es_file_fk_resp_id,
      'Dossier incomplet',
      `${req.user.user_full_name} a marqué le dossier ${fileDetails[0].es_file_full_id} comme incomplet, Visitez la page des dossiers client pour le consulter`,
      link,
      fileDetails[0].es_file_full_id
    );
    res.status(200).json({
      success: 'Dossier client marqué comme incomplet avec succès',
      message: `Le dossier client "${fileDetails[0].es_file_full_id}" a été marqué comme incomplet avec succès.`
    });
  } catch (err) {
    res.status(500).json({
      error: 'Erreur lors du marquage du dossier client comme incomplet',
      message: "Erreur interne, Contactez l'administrateur"
    });
    console.log(err);
  }
});
//Mark File as complete
router.post('/files-complete', checkPermission('CanPOSTFiles'), async (req, res) => {
  try {
    const fileId = req.body.file_id;
    const fileDetails = await db('es_files').select('*').where('es_file_id', fileId);
    if (fileDetails.length === 0) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }
    if (fileDetails[0].es_file_incomplete === 0) {
      return res.status(409).json({ error: 'Dossier déjà marqué comme complet' });
    }
    await db('es_files').where('es_file_id', fileId).update({
      es_file_incomplete: 0,
      es_file_incomplete_comment: ''
    });
    await db('es_files_dashboard').insert({
      es_dashboard_title: 'Dossier client complet',
      es_dashboard_content: `Le dossier client ${fileDetails[0].es_file_full_id} a été marqué comme complet par ${req.user.user_full_name}`,
      es_dashboard_status: 14,
      es_dashboard_timestamp: new Date(),
      es_dashboard_fk_file_id: fileDetails[0].es_file_id,
      es_dashboard_fk_user_id: req.user.user_id
    });
    await db('w_activity_log').insert({
      user_id: req.user.user_id,
      action: 'Client file marked as complete',
      details: `Client file ${fileDetails[0].es_file_full_id} marked as complete by ${req.user.user_full_name}`,
      timestamp: new Date()
    });
    const link = `/dossiers/${fileDetails[0].es_file_full_id}`;
    sendNotificationAndEmail(
      fileDetails[0].es_file_fk_resp_id,
      'Dossier complet',
      `${req.user.user_full_name} a marqué le dossier ${fileDetails[0].es_file_full_id} comme complet, Visitez la page des dossiers client pour le consulter`,
      link,
      fileDetails[0].es_file_full_id
    );
    res.status(200).json({
      success: 'Dossier client marqué comme complet avec succès',
      message: `Le dossier client "${fileDetails[0].es_file_full_id}" a été marqué comme complet avec succès.`
    });
  } catch (err) {
    res.status(500).json({
      error: 'Erreur lors du marquage du dossier client comme complet',
      message: "Erreur interne, Contactez l'administrateur"
    });
    console.log(err);
  }
});
router.get('/tasks/:filter', checkPermission('CanViewTasks'), async (req, res) => {
  try {
    const { role_name, user_id } = req.user;
    let tasks = db('es_tasks')
      .select(
        'es_tasks.*',
        db.raw("DATE_FORMAT(task_deadline, '%d/%m/%Y %H:%i:%s') as task_deadline"),
        db.raw("DATE_FORMAT(task_submission_time, '%d/%m/%Y %H:%i:%s') as task_submission_time"),
        db.raw("DATE_FORMAT(task_created_at, '%d/%m/%Y %H:%i:%s') as task_created_at"),
        db.raw("DATE_FORMAT(task_seen_time, '%d/%m/%Y %H:%i:%s') as task_seen_time"),
        db.raw(`
          (
              CASE
                WHEN '${role_name}' IN ('Lab Tech', 'Lab Resp') AND ${user_id} IN (
                  es_files.es_file_fk_resp_id,
                  es_files.es_file_fk_verif_id,
                  es_files.es_file_fk_tech_id
                ) THEN true
                WHEN '${role_name}' NOT IN ('Lab Tech', 'Lab Resp') THEN true
                ELSE false
              END
            ) AS CanSeeLink`),
        'w_users1.user_full_name as task_assigned_from_name',
        'w_users2.user_full_name as task_assigned_to_name',
        'es_files.es_file_full_id',
        'es_files.es_file_fk_client_id',
        'w_clients.client_name'
      )
      .from('es_tasks')
      .leftJoin('w_users as w_users1', 'es_tasks.task_assigned_from', 'w_users1.user_id')
      .leftJoin('w_users as w_users2', 'es_tasks.task_assigned_to', 'w_users2.user_id')
      .leftJoin('es_files', 'es_tasks.task_fk_file_id', 'es_files.es_file_id')
      .leftJoin('w_clients', 'es_files.es_file_fk_client_id', 'w_clients.client_id')
      .orderBy('task_deadline', 'asc');

    if (req.params.filter === 'inprogress') {
      tasks = tasks.where('task_status', 'Créée').orWhere('task_status', 'En cours').orWhere('task_status', 'Terminée');
    } else if (req.params.filter === 'validated') {
      tasks = tasks.where('task_status', 'Validée');
    } else if (req.params.filter === 'cancelled') {
      tasks = tasks.where('task_status', 'Annulée');
    } else if (req.params.filter === 'all') {
    } else {
      return res.status(404).json({ error: 'Filtre non trouvé' });
    }
    let data = await tasks;
    if (req.user.role === 'Lab Tech') {
      data = data.filter((task) => task.task_assigned_to === req.user.user_id || task.task_assigned_from === req.user.user_id);
    } else if (req.user.role === 'Lab Resp') {
      data = data.filter((task) => task.task_assigned_from === req.user.user_id || task.task_assigned_to === req.user.user_id);
    }

    if (req.user.role === 'Lab Resp') {
      data.sort((a, b) => (a.task_status === 'Terminée' ? -1 : b.task_status === 'Terminée' ? 1 : 0));
    }
    if (req.user.role === 'Lab Tech') {
      data.sort((a, b) => (a.task_priority === 'Elevée' ? -1 : b.task_priority === 'Elevée' ? 1 : 0));
      data = data.sort((a, b) => (a.task_status === 'En cours' ? -1 : 0));
    }
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      error: 'Erreur lors de la récupération des tâches',
      message: "Erreur interne, Contactez l'administrateur"
    });
    console.log(err);
  }
});
router.get('/tasks-details/:taskId', async (req, res) => {
  try {
    const [taskDetails] = await db('es_tasks')
      .select(
        'es_tasks.*',
        db.raw("DATE_FORMAT(task_deadline, '%d/%m/%Y %H:%i:%s') as task_deadline"),
        db.raw("DATE_FORMAT(task_submission_time, '%d/%m/%Y %H:%i:%s') as task_submission_time"),
        db.raw("DATE_FORMAT(task_created_at, '%d/%m/%Y %H:%i:%s') as task_created_at"),
        db.raw("DATE_FORMAT(task_seen_time, '%d/%m/%Y %H:%i:%s') as task_seen_time"),
        'w_users1.user_full_name as task_assigned_from_name',
        'w_users2.user_full_name as task_assigned_to_name',
        'es_files.es_file_full_id',
        'es_files.es_file_fk_client_id',
        'w_clients.client_name'
      )
      .from('es_tasks', 'w_users1', 'w_users2', 'es_files')
      .leftJoin('w_users as w_users1', 'es_tasks.task_assigned_from', 'w_users1.user_id')
      .leftJoin('w_users as w_users2', 'es_tasks.task_assigned_to', 'w_users2.user_id')
      .leftJoin('es_files', 'es_tasks.task_fk_file_id', 'es_files.es_file_id')
      .leftJoin('w_clients', 'es_files.es_file_fk_client_id', 'w_clients.client_id')
      .where('es_tasks.task_full_id', req.params.taskId);
    if (taskDetails.length === 0) {
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }

    const taskComments = await db('es_task_comments')
      .select('es_task_comments.*', 'w_users.user_full_name', 'w_users.user_profile_pic')
      .leftJoin('w_users', 'es_task_comments.task_comment_fk_user_id', 'w_users.user_id')
      .where('es_task_comments.task_comment_fk_task_id', taskDetails.task_id)
      .orderBy('task_comment_timestamp', 'desc');
    await Promise.all(
      taskComments.map(async (comment) => {
        const uploads = await db('es_task_uploads').select('*').where('es_task_uploads.task_comment_id', comment.task_comment_id);
        comment.uploads = uploads;
      })
    );

    const data = { taskDetails, taskComments };
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      error: 'Erreur lors de la récupération des détails de la tâche',
      message: "Erreur interne, Contactez l'administrateur"
    });
    console.log(err);
  }
});
router.get('/files-options', async (req, res) => {
  try {
    const files = await db('es_files')
      .select('es_file_id as value', 'es_file_full_id', 'client_name')
      .leftJoin('w_clients', 'es_files.es_file_fk_client_id', 'w_clients.client_id')
      .where('es_file_fk_resp_id', req.user.user_id)
      .andWhere('es_file_fk_status_id', '<', 6)
      .andWhere('es_file_fk_status_id', '!=', 0);
    const data = files.map((file) => ({
      value: file.value,
      label: file.es_file_full_id + ' - ' + file.client_name
    }));
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      error: 'Erreur lors de la récupération des options de dossiers',
      message: "Erreur interne, Contactez l'administrateur"
    });
    console.log(err);
  }
});
router.post('/tasks', checkRole('Lab Resp'), async (req, res) => {
  const trx = await db.transaction();

  try {
    const taskId = await GetNextTaskId();
    const { task_assigned_to, task_priority, task_title, task_details, task_deadline, task_fk_file_id } = req.body;
    const task_assigned_from = req.user.user_id;

    const [taskInsertedId] = await trx('es_tasks').insert({
      task_full_id: taskId,
      task_created_at: new Date(),
      task_priority,
      task_assigned_from,
      task_assigned_to,
      task_title,
      task_details,
      task_deadline,
      task_fk_file_id
    });

    await trx('es_task_comments').insert({
      task_comment_title: 'Tâche ajoutée',
      task_comment_content: `Tâche ${taskId} ajoutée par ${req.user.user_full_name}`,
      task_comment_status: 1,
      task_comment_timestamp: new Date(),
      task_comment_fk_task_id: taskInsertedId,
      task_comment_fk_user_id: req.user.user_id
    });

    await trx('w_activity_log').insert({
      user_id: req.user.user_id,
      action: 'Task added',
      details: `Task ${taskId} added by ${req.user.user_full_name}`,
      timestamp: new Date()
    });

    await trx.commit();

    const link = `/taches/${taskId}`;
    sendNotificationAndEmail(
      task_assigned_to,
      'Nouvelle tâche',
      `${req.user.user_full_name} vous a assigné une nouvelle tâche ${taskId}, Visitez la page des tâches pour la consulter`,
      link,
      taskId
    );

    res.status(200).json({
      success: 'Tâche ajoutée avec succès',
      message: `La tâche "${taskId}" a été ajoutée avec succès.`
    });
  } catch (err) {
    await trx.rollback();
    res.status(500).json({
      error: "Erreur lors de l'ajout de la tâche",
      message: "Erreur interne, Contactez l'administrateur"
    });
    console.error('Error adding task:', err);
  }
});
//Download files
router.get('/download-task-files/:file_comment_id', async (req, res) => {
  try {
    const { file_comment_id } = req.params;
    console.log(file_comment_id);
    const uploads = await db('es_task_uploads')
      .select('task_upload_file_name', 'task_upload_filepath')
      .where('task_comment_id', file_comment_id);

    if (!uploads || uploads.length === 0) {
      return res.status(404).json({ error: 'No uploads found for the provided comment ID' });
    }
    const zip = new JSZip();
    uploads.forEach((upload) => {
      const filePath = path.join(__dirname, '..', upload.task_upload_filepath);
      const fileContent = fs.readFileSync(filePath);
      zip.file(upload.task_upload_file_name, fileContent);
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
//Mark Task as read
router.post('/tasks-mark-as-read', checkPermission('CanViewTasks'), async (req, res) => {
  try {
    await db('es_tasks').where('task_status', 'Créée').andWhere('task_assigned_to', req.user.user_id).update({
      task_status: 'En cours',
      task_seen_time: new Date()
    });
    res.status(200).json({
      success: 'Tâches marquées comme lues avec succès',
      message: `Les tâches ont été marquées comme lues avec succès.`
    });
  } catch (err) {
    res.status(500).json({
      error: 'Erreur lors de la mise à jour des tâches',
      message: "Erreur interne, Contactez l'administrateur"
    });
    console.log(err);
  }
});
//Submit Task
router.post('/task-submit', checkRole('Lab Tech'), upload.array('attachments'), async (req, res) => {
  const trx = await db.transaction();
  try {
    const { task_id, comment } = req.body;
    const taskDetails = await trx('es_tasks').select('*').where('task_id', task_id).first();

    if (!taskDetails) {
      await trx.rollback();
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }

    if (
      taskDetails.task_assigned_to !== req.user.user_id ||
      (taskDetails.task_status !== 'En cours' && taskDetails.task_status !== 'Terminée')
    ) {
      await trx.rollback();
      return res.status(403).json({
        error: 'Permission non accordée',
        message: "Vous n'avez pas la permission d'effectuer cette action"
      });
    }

    const [taskCommentId] = await trx('es_task_comments').insert({
      task_comment_title: 'Tâche soumise',
      task_comment_content: comment || '',
      task_comment_status: 2,
      task_comment_timestamp: new Date(),
      task_comment_fk_task_id: taskDetails.task_id,
      task_comment_fk_user_id: req.user.user_id
    });

    if (req.files && req.files.length > 0) {
      const uploads = req.files;
      const folderPath = `./uploads/tasks/${taskDetails.task_full_id}`;
      try {
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }
      } catch (err) {
        console.error(`Error creating folder: ${err.message}`);
      }

      for (const upload of uploads) {
        const oldPath = upload.path;
        const newPath = path.join(folderPath, upload.filename);
        fs.renameSync(oldPath, newPath);

        const filePath = newPath.replace(/^\./, '');
        await trx('es_task_uploads').insert({
          task_comment_id: taskCommentId,
          task_upload_file_name: upload.originalname,
          task_upload_filesize: upload.size,
          task_upload_filepath: filePath
        });
      }
    }

    await trx('es_tasks').where('task_id', task_id).update({
      task_status: 'Terminée',
      task_submission_time: new Date()
    });

    await trx('w_activity_log').insert({
      user_id: req.user.user_id,
      action: 'Tâche soumise',
      details: `Tâche ${taskDetails.task_full_id} soumise par ${req.user.user_full_name}`,
      timestamp: new Date()
    });

    const link = `/taches/${taskDetails.task_full_id}`;
    sendNotificationAndEmail(
      taskDetails.task_assigned_from,
      'Tâche soumise',
      `${req.user.user_full_name} a soumis une tâche ${taskDetails.task_full_id}, Visitez la page des tâches pour la consulter`,
      link,
      taskDetails.task_full_id
    );

    await trx.commit();
    res.status(200).json({
      success: 'Tâche soumise avec succès',
      message: `La tâche "${taskDetails.task_full_id}" a été soumise avec succès.`
    });
  } catch (err) {
    await trx.rollback();
    res.status(500).json({
      error: 'Erreur lors de la soumission de la tâche',
      message: "Erreur interne, Contactez l'administrateur"
    });
    console.log(err);
  }
});

//Validate Task
router.post('/task-validate', checkRole('Lab Resp'), async (req, res) => {
  const trx = await db.transaction();
  try {
    const { task_id, decision, comment } = req.body;

    const taskDetails = await trx('es_tasks').select('*').where('task_id', task_id).first();

    if (!taskDetails) {
      await trx.rollback();
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }

    if (taskDetails.task_assigned_from !== req.user.user_id || taskDetails.task_status !== 'Terminée') {
      await trx.rollback();
      return res.status(403).json({
        error: 'Permission non accordée',
        message: "Vous n'avez pas la permission d'effectuer cette action"
      });
    }

    const statusUpdate = decision === 'accept' ? 'Validée' : 'En cours';
    const taskCommentTitle = decision === 'accept' ? 'Tâche validée' : 'Tâche refusée';
    const taskCommentStatus = decision === 'accept' ? 3 : 4;
    const taskError = decision === 'refuse' ? 1 : 0;

    await trx('es_tasks').where('task_id', taskDetails.task_id).update({
      task_status: statusUpdate,
      task_error: taskError
    });

    await trx('es_task_comments').insert({
      task_comment_title: taskCommentTitle,
      task_comment_content: comment || '',
      task_comment_status: taskCommentStatus,
      task_comment_timestamp: new Date(),
      task_comment_fk_task_id: taskDetails.task_id,
      task_comment_fk_user_id: req.user.user_id
    });

    await trx('w_activity_log').insert({
      user_id: req.user.user_id,
      action: taskCommentTitle,
      details: `Tâche ${taskDetails.task_full_id} ${decision === 'accept' ? 'validée' : 'refusée'} par ${req.user.user_full_name}`,
      timestamp: new Date()
    });

    const link = `/taches/${taskDetails.task_full_id}`;
    const notificationMessage = `${req.user.user_full_name} a ${decision === 'accept' ? 'validé' : 'refusé'} une tâche ${
      taskDetails.task_full_id
    }, Visitez la page des tâches pour la consulter`;

    sendNotificationAndEmail(taskDetails.task_assigned_to, taskCommentTitle, notificationMessage, link, taskDetails.task_full_id);

    await trx.commit();

    res.status(200).json({
      success: `Tâche ${decision === 'accept' ? 'validée' : 'refusée'} avec succès`,
      message: `La tâche "${taskDetails.task_full_id}" a été ${decision === 'accept' ? 'validée' : 'refusée'} avec succès.`
    });
  } catch (err) {
    await trx.rollback();
    console.error(err);
    res.status(500).json({
      error: 'Erreur lors de la validation de la tâche',
      message: "Erreur interne, Contactez l'administrateur"
    });
  }
});
//Cancel Task
router.put('/task-cancel', checkRole('Lab Resp'), async (req, res) => {
  try {
    const { task_id } = req.body;
    const taskDetails = await db('es_tasks').select('*').where('task_id', task_id);
    if (taskDetails.length === 0) {
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }
    if (
      taskDetails[0].task_assigned_from !== req.user.user_id ||
      taskDetails[0].task_status === 'Validée' ||
      taskDetails[0].task_status === 'Annulée'
    ) {
      return res.status(403).json({
        error: 'Permission non accordée',
        message: "Vous n'avez pas la permission d'effectuer cette action"
      });
    }
    await db('es_tasks').where('task_id', task_id).update({
      task_status: 'Annulée',
      task_error: 0
    });
    await db('es_task_comments').insert({
      task_comment_title: 'Tâche annulée',
      task_comment_content: `Tâche ${taskDetails[0].task_full_id} annulée par ${req.user.user_full_name}`,
      task_comment_status: 5,
      task_comment_timestamp: new Date(),
      task_comment_fk_task_id: taskDetails[0].task_id,
      task_comment_fk_user_id: req.user.user_id
    });
    await db('w_activity_log').insert({
      user_id: req.user.user_id,
      action: 'Tâche annulée',
      details: `Tâche ${taskDetails[0].task_full_id} annulée par ${req.user.user_full_name}`,
      timestamp: new Date()
    });
    const link = `/taches/${taskDetails[0].task_full_id}`;
    sendNotificationAndEmail(
      taskDetails[0].task_assigned_to,
      'Tâche annulée',
      `${req.user.user_full_name} a annulé une tâche ${taskDetails[0].task_full_id}, Visitez la page des tâches pour la consulter`,
      link,
      taskDetails[0].task_full_id
    );
    res.status(200).json({
      success: 'Tâche annulée avec succès',
      message: `La tâche "${taskDetails[0].task_full_id}" a été annulée avec succès.`
    });
  } catch (err) {
    res.status(500).json({
      error: "Erreur lors de l'annulation de la tâche",
      message: "Erreur interne, Contactez l'administrateur"
    });
    console.log(err);
  }
});

module.exports = router;

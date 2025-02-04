import dayjs from 'dayjs';
import axios from 'axios';
import Swal from 'sweetalert2';
import apiLinks from 'config/apiLinks';
export const initialValuesST = {
  devis_date: dayjs(),
  devis_object: '',
  devis_note: '',
  devis_currency: 'DH',
  devis_tax: 1,
  devis_forfait: 0,
  devis_fk_client_id: null,
  devis_fk_sector_id: null,
  devis_fk_type_id: null,
  devis_fk_modality_id: null,
  elements: [
    {
      element_note: '',
      element_quantity: 1,
      element_discount: 0,
      element_price: 0,
      element_fk_labtest_id: null
    }
  ]
};
export const initialValuesFF = {
  devis_date: dayjs(),
  devis_object: '',
  devis_note: '',
  devis_currency: 'DH',
  devis_tax: 1,
  devis_forfait: 0,
  devis_fk_client_id: null,
  devis_fk_sector_id: null,
  devis_fk_type_id: null,
  devis_fk_modality_id: null,
  elements: [
    {
      element_designation: '',
      element_quantity: 1,
      element_discount: 0,
      element_price: 0
    }
  ]
};
export const pdfDataST = {
  devis_type: 'ST',
  conversion_rate: 1,
  devis_formatted_id: '',
  devis_date: dayjs(),
  client_name: '',
  client_city: '',
  devis_object: '',
  devis_note: '',
  devis_currency: 'DH',
  devis_tax: 1,
  devis_forfait: 0,
  modality_name: '',
  elements: [
    {
      labtest_full_id: '',
      labtest_designation: '',
      element_note: '',
      method_name: '',
      acc_name: '',
      element_quantity: 1,
      element_discount: 0,
      element_price: 0,
      element_total: 0
    }
  ],
  totals: {
    totalHT: 0,
    totalTVA: 0,
    totalTTC: 0
  }
};
export const pdfDataFF = {
  devis_type: 'FF',
  conversion_rate: 1,
  devis_formatted_id: '',
  devis_date: dayjs(),
  client_name: '',
  client_city: '',
  devis_object: '',
  devis_note: '',
  devis_currency: 'DH',
  devis_tax: 1,
  devis_forfait: 0,
  modality_name: '',
  elements: [
    {
      element_designation: '',
      element_quantity: 1,
      element_discount: 0,
      element_price: 0,
      element_total: 0
    }
  ],
  totals: {
    totalHT: 0,
    totalTVA: 0,
    totalTTC: 0
  }
};
export async function getOptions({
  setClientOptions,
  setTypeOptions,
  setSectorOptions,
  setModalityOptions,
  setLabtestOptions,
  setDevisFormattedId,
  setLoading
}) {
  try {
    const [clients, types, sectors, modalities, labtests, devisFormattedId] = await Promise.all([
      axios.get(apiLinks.GET.clients),
      axios.get(apiLinks.GET.types),
      axios.get(apiLinks.GET.sectors),
      axios.get(apiLinks.GET.modalities),
      axios.get(apiLinks.GET.labtests),
      axios.get(apiLinks.GET.nextDevisId)
    ]);

    setClientOptions(clients.data);
    setTypeOptions(types.data);
    setSectorOptions(sectors.data);
    setModalityOptions(modalities.data);
    setLabtestOptions(labtests.data);
    setDevisFormattedId(devisFormattedId.data);
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Erreur!',
      text: "Erreur lors du chargement des données, veuillez rafraîchir la page ou contacter l'administrateur."
    });
    console.error('Error fetching options:', error);
  } finally {
    setLoading(false);
  }
}

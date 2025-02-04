/* eslint-disable react/no-unescaped-entities */
import PropTypes from 'prop-types';
import { Page, Text, View, Document, Image, Font, Link } from '@react-pdf/renderer';
import Regular from '../assets/fonts/Roboto-Regular.ttf';
import Bold from '../assets/fonts/Roboto-Bold.ttf';
import Italic from '../assets/fonts/Roboto-Italic.ttf';
import BoldItalic from '../assets/fonts/Roboto-BoldItalic.ttf';
import dayjs from 'dayjs';

import GMSignature from '../assets/signatures/gm-signature.png';
import Logo from '../assets/images/full-logo.png';
import { currencyFormatter } from 'utils/genUtils';
import { htmlToReactPDF } from './pdfUtils';
import {
  styles,
  mainHeaderStyles,
  headerStyles,
  notesAndTotalsStyles,
  signaturesStyles,
  footerStyles,
  tableBodyStyles,
  tableHeaderStyles
} from './pdfStyles';
const MainHeader = ({ devisData }) => (
  <View style={mainHeaderStyles.mainHeader} fixed>
    <View>
      <Image style={mainHeaderStyles.image} src={Logo} />
    </View>
    <View style={mainHeaderStyles.devisSide}>
      <Text style={mainHeaderStyles.devisNumber}>Devis N° {devisData?.devis_formatted_id || 'AADXXXX'}</Text>
      <Text style={mainHeaderStyles.devisDates}>Date : {dayjs(devisData?.devis_date)?.format('DD/MM/YYYY') || 'JJ/MM/AAAA'}</Text>
      <Text style={mainHeaderStyles.devisDates}>
        Validité : {dayjs(devisData?.devis_date)?.add(1, 'month').format('DD/MM/YYYY') || 'JJ/MM/AAAA'}
      </Text>
    </View>
  </View>
);

const Header = ({ devisData }) => (
  <View>
    <View style={headerStyles.clientAndObject}>
      <View style={headerStyles.clientInfo}>
        <Text style={headerStyles.Title}>Client</Text>
        <Text style={headerStyles.Text}>{devisData.client_name || '[Nom du client]'}</Text>
        <Text style={headerStyles.Text}>{devisData.client_city || '[Adresse du client]'}</Text>
      </View>
      <View style={headerStyles.objectInfo}>
        <Text style={headerStyles.Title}>Objet</Text>
        <Text style={headerStyles.Text}>{devisData.devis_object || '[Objet du devis]'}</Text>
      </View>
    </View>
    <View style={headerStyles.salutationCont}>
      <Text style={headerStyles.salutation}>Madame, Monsieur,</Text>
      <Text style={headerStyles.salutation}>
        Suite à votre demande, nous avons le plaisir de vous faire parvenir notre offre commerciale :
      </Text>
    </View>
  </View>
);

const NotesAndTotals = ({ devisData }) => (
  <View style={notesAndTotalsStyles.NotesandTotals} wrap={false}>
    <View style={notesAndTotalsStyles.Notes} wrap={false}>
      <Text style={notesAndTotalsStyles.Title}>Notes</Text>
      <View style={notesAndTotalsStyles.Text}>
        <Text style={notesAndTotalsStyles.Bold}>Modalité de paiement:</Text>
        <Text style={notesAndTotalsStyles.Normal}>{devisData.modality_name || '[Modalité de paiement]'}</Text>
      </View>
      <View style={notesAndTotalsStyles.Text}>
        <Text style={notesAndTotalsStyles.Bold}>Délai de livraison:</Text>
        <Text style={notesAndTotalsStyles.Normal}>À planifier lors de la réception de votre bon de commande</Text>
      </View>
      <View style={notesAndTotalsStyles.Text}>
        <Text style={notesAndTotalsStyles.Bold}>Validité de l`offre:</Text>
        <Text style={notesAndTotalsStyles.Normal}>1 mois</Text>
      </View>
      <Text style={notesAndTotalsStyles.BoldItalic}>
        Sauf spécification contraire, la conformité est déclarée sans tenir en compte les incertitudes
      </Text>
      <View style={{ height: 10 }} />
      <Text style={notesAndTotalsStyles.Bold}>
        *: Acc. (Accréditation): La nature d'accréditation de test; Cofrac : CO . Semac: SE . ND : Nadcap. AB : Airbus. RE : Renault. Non
        Accrédité : NA
      </Text>
    </View>

    <View style={notesAndTotalsStyles.totals} wrap={false}>
      <View style={notesAndTotalsStyles.totalsRow}>
        <Text style={notesAndTotalsStyles.totalsTitle}>Total H.T.</Text>

        <Text style={notesAndTotalsStyles.totalsValue}>
          {devisData?.totals.totalHT && currencyFormatter(devisData?.totals.totalHT / devisData?.conversion_rate, devisData.devis_currency)}
        </Text>
      </View>
      <View style={notesAndTotalsStyles.line} />
      {Boolean(devisData.devis_tax) && (
        <View>
          <View style={notesAndTotalsStyles.totalsOddRow}>
            <Text style={notesAndTotalsStyles.totalsTitle}>TVA (20%)</Text>
            <Text style={notesAndTotalsStyles.totalsValue}>
              {devisData?.totals.totalTVA &&
                currencyFormatter(devisData?.totals.totalTVA / devisData?.conversion_rate, devisData.devis_currency)}
            </Text>
          </View>
          <View style={notesAndTotalsStyles.line} />
          <View style={notesAndTotalsStyles.totalsRow}>
            <Text style={notesAndTotalsStyles.totalsTitle}>Total T.T.C.</Text>
            <Text style={notesAndTotalsStyles.totalsValue}>
              {devisData?.totals.totalTTC &&
                currencyFormatter(devisData?.totals.totalTTC / devisData?.conversion_rate, devisData.devis_currency)}
            </Text>
          </View>
        </View>
      )}
    </View>
  </View>
);

const Signatures = ({ devisData }) => (
  <>
    <View style={signaturesStyles.topFooter} wrap={false}>
      <View style={signaturesStyles.clientSignature}>
        <Text style={signaturesStyles.clientSignatureText}>ACCEPTATION DE L'OFFRE {devisData.devis_formatted_id || 'AADXXXX'}</Text>
        <Text style={signaturesStyles.clientSignatureText}>Date / Nom / Signature / Cachet de la société</Text>
      </View>
      <View style={signaturesStyles.ctpcSignature}>
        <Text style={signaturesStyles.ctpcSignatureText}> DIRECTEUR GÉNÉRAL</Text>
        <Text style={signaturesStyles.ctpcSignatureText}> Nasser ALANSSARI</Text>
        {devisData?.devis_fk_status_id >= 3 && <Image style={signaturesStyles.signatureimage} src={GMSignature} />}
      </View>
    </View>
  </>
);
const Footer = () => (
  <>
    <View style={footerStyles.thankYou}>
      <Text style={footerStyles.Title}>Merci de nous avoir fait confiance</Text>
      <Text style={footerStyles.Text}>
        Si vous avez des questions concernant ce devis, Veuillez contacter le Responsable Technico-Commercial :{' '}
        <Link src="mailto:commercial@ctpc.ma" style={styles.Link}>
          commercial@ctpc.ma
        </Link>
      </Text>
    </View>
    <View style={footerStyles.footer} fixed>
      <View>
        <View style={footerStyles.footerLine} />
        <Text style={footerStyles.Text}>
          Complexe des Centres Techniques, Bd Abdelmalek Essaâdi, Sidi Maârouf - 20280 - Casablanca - Maroc
        </Text>
        <Text style={footerStyles.Text}>
          Tél : +212 5 22 58 09 50/77 | Fax : +212 5 22 58 05 31 | E-mail :{' '}
          <Link src="mailto:clients@ctpc.ma" style={styles.Link}>
            clients@ctpc.ma
          </Link>
        </Text>
        <Text style={footerStyles.Text}>IF 2203774 | Patente : 36166737 | CNSS : 7376818 | ICE N°: 0016856000088</Text>

        <View style={footerStyles.footerInfo} fixed>
          <Text style={footerStyles.Text}>FO-M-03-01-Indice 06</Text>
          <Text
            style={footerStyles.pageNumber}
            render={({ pageNumber, totalPages }) => (totalPages > 1 ? `Page ${pageNumber} / ${totalPages}` : '')}
          />
          <Text style={footerStyles.Text}>Rattachée à la procédure PGM.03</Text>
        </View>
      </View>
    </View>
  </>
);

function TableHeaderST({ devisData }) {
  const NoDiscount = devisData?.elements?.every((t) => t.element_discount === 0);
  const smallWidth = '6%';
  const avgWidth = '10%';
  const largeWidth = '18%';
  let extraLargeWidth = NoDiscount ? '42%' : '36%';
  return (
    <View style={tableHeaderStyles.Header}>
      <View style={[tableHeaderStyles.Cell, { width: smallWidth }]}>
        <Text style={tableHeaderStyles.Text}>Code</Text>
      </View>
      <View style={[tableHeaderStyles.Cell, { width: extraLargeWidth }]}>
        <Text style={tableHeaderStyles.Text}>Désignation</Text>
      </View>
      <View style={[tableHeaderStyles.Cell, { width: largeWidth }]}>
        <Text style={tableHeaderStyles.Text}>Méthode</Text>
      </View>
      <View style={[tableHeaderStyles.Cell, { width: smallWidth }]}>
        <Text style={tableHeaderStyles.Text}>Acc.*</Text>
      </View>
      <View style={[tableHeaderStyles.Cell, { width: smallWidth }]}>
        <Text style={tableHeaderStyles.Text}>Qté</Text>
      </View>
      {!NoDiscount && (
        <View style={[tableHeaderStyles.Cell, { width: smallWidth }]}>
          <Text style={tableHeaderStyles.Text}>Rem.</Text>
        </View>
      )}
      <View style={[tableHeaderStyles.Cell, { width: avgWidth }]}>
        <Text style={tableHeaderStyles.Text}>Prix H.T.</Text>
      </View>
      <View style={[tableHeaderStyles.Cell, { width: avgWidth }]}>
        <Text style={tableHeaderStyles.Text}>Total H.T.</Text>
      </View>
    </View>
  );
}
const TableHeaderFF = ({ devisData }) => {
  const NoDiscount = devisData?.elements?.every((t) => t.element_discount === 0);
  const columnWidths = {
    small: '6%',
    large: '12%',
    extraLarge: NoDiscount ? '69%' : '63%'
  };
  return (
    <View style={tableHeaderStyles.Header}>
      <View style={[tableHeaderStyles.Cell, { width: columnWidths.extraLarge }]}>
        <Text style={tableHeaderStyles.Text}>Désignation</Text>
      </View>
      <View style={[tableHeaderStyles.Cell, { width: columnWidths.small }]}>
        <Text style={tableHeaderStyles.Text}>Qté</Text>
      </View>
      {!NoDiscount && (
        <View style={[tableHeaderStyles.Cell, { width: columnWidths.small }]}>
          <Text style={tableHeaderStyles.Text}>Rem.</Text>
        </View>
      )}
      <View style={[tableHeaderStyles.Cell, { width: columnWidths.large }]}>
        <Text style={tableHeaderStyles.Text}>Prix H.T.</Text>
      </View>
      <View style={[tableHeaderStyles.Cell, { width: columnWidths.large }]}>
        <Text style={tableHeaderStyles.Text}>Total H.T.</Text>
      </View>
    </View>
  );
};

const getRowBackgroundColor = (index, forfait) => {
  if (forfait) {
    return '#fff';
  }
  return index % 2 === 0 ? '#fff' : '#f5f5f5';
};
const renderTableCell = (content, customStyle) => (
  <View style={[tableBodyStyles.Cell, customStyle]}>
    <Text style={tableBodyStyles.Text}>{content}</Text>
  </View>
);
function TableBodyST({ devisData }) {
  const avgDiscount = devisData?.elements?.reduce((a, b) => a + b.element_discount, 0) / devisData?.elements?.length;
  const avgDiscountString = Number.isInteger(avgDiscount) ? avgDiscount + '%' : avgDiscount.toFixed(2).toString().replace('.', ',') + '%';

  const NoDiscount = avgDiscount === 0;

  const columnWidths = {
    small: '6%',
    medium: '10%',
    large: '18%',
    extraLarge: NoDiscount ? '42%' : '36%'
  };

  const TableRow = ({ item, index }) => {
    const isForfait = devisData.devis_forfait;
    const isMiddleRow = index === Math.floor(devisData.elements.length / 2);
    const isMiddleRowEven = Math.floor(devisData.elements.length / 2) % 2 === 0 || devisData.elements.length === 2;
    const marginTop = isMiddleRow && isMiddleRowEven ? -10 : 0;
    const backgroundColor = getRowBackgroundColor(index, isForfait);
    const backgroundColor2 = getRowBackgroundColor(index, false);
    return (
      <View style={tableBodyStyles.Row} wrap={false} key={index}>
        {renderTableCell(item.labtest_full_id, { width: columnWidths.small, backgroundColor: backgroundColor2 })}
        <View style={[tableBodyStyles.Cell, { width: columnWidths.extraLarge, backgroundColor: backgroundColor2 }]}>
          <View style={tableBodyStyles.designation}>
            <Text style={tableBodyStyles.Text}>{item.labtest_designation}</Text>
            <Text style={tableBodyStyles.Note}>{item.element_note}</Text>
          </View>
        </View>
        {renderTableCell(item.method_name, { width: columnWidths.large, backgroundColor: backgroundColor2 })}
        {renderTableCell(item.acc_name, { width: columnWidths.small, backgroundColor: backgroundColor2, textAlign: 'center' })}
        {isForfait
          ? renderTableCell(isMiddleRow && 'F', {
              width: columnWidths.small,
              backgroundColor,
              textAlign: 'center',
              marginTop: marginTop
            })
          : renderTableCell(item.element_quantity, { width: columnWidths.small, backgroundColor, textAlign: 'center' })}
        {!NoDiscount &&
          (isForfait
            ? renderTableCell(isMiddleRow && avgDiscountString, {
                width: columnWidths.small,
                backgroundColor,
                textAlign: 'center',
                marginTop: marginTop
              })
            : renderTableCell(`${item.element_discount}%`, { width: columnWidths.small, backgroundColor, textAlign: 'center' }))}
        {isForfait
          ? renderTableCell(
              isMiddleRow && currencyFormatter(devisData.totals.totalHT / devisData?.conversion_rate / (1 - avgDiscount / 100)),
              {
                width: columnWidths.medium,
                backgroundColor,
                textAlign: 'right',
                marginTop: marginTop
              }
            )
          : renderTableCell(currencyFormatter(item.element_price / devisData?.conversion_rate), {
              width: columnWidths.medium,
              backgroundColor,
              textAlign: 'right'
            })}
        {isForfait
          ? renderTableCell(isMiddleRow && currencyFormatter(devisData.totals.totalHT / devisData?.conversion_rate), {
              width: columnWidths.medium,
              backgroundColor,
              textAlign: 'right',
              marginTop: marginTop
            })
          : renderTableCell(currencyFormatter(item.element_total / devisData?.conversion_rate), {
              width: columnWidths.medium,
              backgroundColor,
              textAlign: 'right'
            })}
      </View>
    );
  };
  TableRow.propTypes = {
    item: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired
  };
  return (
    <View style={tableBodyStyles.Body}>
      {devisData?.elements.map((item, index) => (
        <TableRow key={index} item={item} index={index} />
      ))}
    </View>
  );
}
function TableBodyFF({ devisData }) {
  const avgDiscount = devisData?.elements?.reduce((a, b) => a + b.element_discount, 0) / devisData?.elements?.length;
  const avgDiscountString = Number.isInteger(avgDiscount) ? avgDiscount + '%' : avgDiscount.toFixed(2).toString().replace('.', ',') + '%';

  const NoDiscount = avgDiscount === 0;

  const columnWidths = {
    small: '6%',
    large: '12%',
    extraLarge: NoDiscount ? '69%' : '63%'
  };
  const TableRow = ({ item, index }) => {
    const isForfait = devisData.devis_forfait;
    const isMiddleRow = index === Math.floor(devisData.elements.length / 2);
    const isMiddleRowEven = Math.floor(devisData.elements.length / 2) % 2 === 0 || devisData.elements.length === 2;
    const marginTop = isMiddleRow && isMiddleRowEven ? -10 : 0;
    const backgroundColor = getRowBackgroundColor(index, isForfait);
    const backgroundColor2 = getRowBackgroundColor(index, false);
    return (
      <View style={tableBodyStyles.Row} wrap={false} key={index}>
        <View style={[tableBodyStyles.Cell, { width: columnWidths.extraLarge, backgroundColor: backgroundColor2 }]}>
          {htmlToReactPDF(item.element_designation, styles)}
        </View>
        {isForfait
          ? renderTableCell(isMiddleRow && 'F', {
              width: columnWidths.small,
              backgroundColor,
              textAlign: 'center',
              marginTop: marginTop
            })
          : renderTableCell(item.element_quantity, { width: columnWidths.small, backgroundColor, textAlign: 'center' })}
        {!NoDiscount &&
          (isForfait
            ? renderTableCell(isMiddleRow && avgDiscountString, {
                width: columnWidths.small,
                backgroundColor,
                textAlign: 'center',
                marginTop: marginTop
              })
            : renderTableCell(`${item.element_discount}%`, { width: columnWidths.small, backgroundColor, textAlign: 'center' }))}
        {isForfait
          ? renderTableCell(
              isMiddleRow && currencyFormatter(devisData.totals.totalHT / devisData?.conversion_rate / (1 - avgDiscount / 100)),
              {
                width: columnWidths.medium,
                backgroundColor,
                textAlign: 'right',
                marginTop: marginTop
              }
            )
          : renderTableCell(currencyFormatter(item.element_price / devisData?.conversion_rate), {
              width: columnWidths.large,
              backgroundColor,
              textAlign: 'right'
            })}
        {isForfait
          ? renderTableCell(isMiddleRow && currencyFormatter(devisData.totals.totalHT / devisData?.conversion_rate), {
              width: columnWidths.medium,
              backgroundColor,
              textAlign: 'right',
              marginTop: marginTop
            })
          : renderTableCell(currencyFormatter(item.element_total / devisData?.conversion_rate), {
              width: columnWidths.large,
              backgroundColor,
              textAlign: 'right'
            })}
      </View>
    );
  };
  TableRow.propTypes = {
    item: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired
  };
  return (
    <View style={tableBodyStyles.Body}>
      {devisData?.elements.map((item, index) => (
        <TableRow key={index} item={item} index={index} />
      ))}
    </View>
  );
}

function Details({ devisData }) {
  return (
    <View>
      {devisData.devis_type === 'ST' && (
        <>
          <TableHeaderST devisData={devisData} />
          <TableBodyST devisData={devisData} />
        </>
      )}
      {devisData.devis_type === 'FF' && (
        <>
          <TableHeaderFF devisData={devisData} />
          <TableBodyFF devisData={devisData} />
        </>
      )}
      <View style={styles.line} />
      {devisData.devis_note && (
        <View style={tableBodyStyles.Row}>
          <Text style={styles.Note}>{devisData.devis_note}</Text>
        </View>
      )}
    </View>
  );
}
function Devis({ devisData }) {
  if (!devisData) {
    return null;
  }
  return (
    <Document>
      <Page style={styles.body} wrap size="A4" orientation="portrait">
        <MainHeader devisData={devisData} />
        <Header devisData={devisData} />
        <Details devisData={devisData} />
        <View wrap={false}>
          <NotesAndTotals devisData={devisData} />
          <Signatures devisData={devisData} />
        </View>
        <Footer />
      </Page>
    </Document>
  );
}
Font.register({
  family: 'Regular',
  src: Regular
});
Font.register({
  family: 'Bold',
  src: Bold
});
Font.register({
  family: 'Italic',
  src: Italic
});
Font.register({
  family: 'BoldItalic',
  src: BoldItalic
});
Font.registerHyphenationCallback((word) => [word]);

export default Devis;

Devis.propTypes = {
  devisData: PropTypes.object.isRequired
};
MainHeader.propTypes = {
  devisData: PropTypes.object.isRequired
};
Header.propTypes = {
  devisData: PropTypes.object.isRequired
};
NotesAndTotals.propTypes = {
  devisData: PropTypes.object.isRequired
};
Signatures.propTypes = {
  devisData: PropTypes.object.isRequired
};
TableBodyFF.propTypes = {
  devisData: PropTypes.object.isRequired
};
TableHeaderFF.propTypes = {
  devisData: PropTypes.object.isRequired
};
TableBodyST.propTypes = {
  devisData: PropTypes.object.isRequired
};
TableHeaderST.propTypes = {
  devisData: PropTypes.object.isRequired
};
Details.propTypes = {
  devisData: PropTypes.object.isRequired
};

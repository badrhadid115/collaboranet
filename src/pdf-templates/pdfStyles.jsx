import { StyleSheet } from '@react-pdf/renderer';
export const mainHeaderStyles = StyleSheet.create({
  mainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  image: {
    width: 110,
    height: 85
  },
  devisSide: {
    display: 'flex',
    flexDirection: 'column',
    whiteSpace: 'nowrap',
    textAlign: 'right',
    flex: 1
  },
  devisNumber: {
    marginBottom: 2,
    fontFamily: 'Bold',
    fontSize: 14,
    fontWeight: 600
  },
  devisDates: {
    fontSize: 11,
    fontFamily: 'Regular',
    marginBottom: 2
  }
});
export const headerStyles = StyleSheet.create({
  clientAndObject: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'center',
    marginBottom: 5
  },
  clientInfo: {
    display: 'flex',
    flexDirection: 'column',
    whiteSpace: 'nowrap',
    textAlign: 'justify',
    width: '40%',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 5
  },
  objectInfo: {
    display: 'flex',
    flexDirection: 'column',
    whiteSpace: 'nowrap',
    textAlign: 'justify',
    width: '55%',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 5
  },
  Title: {
    fontSize: 11,
    fontFamily: 'Bold',
    marginBottom: 2
  },
  Text: {
    fontSize: 10,
    marginBottom: 2
  },
  salutationCont: {
    marginBottom: 5
  },
  salutation: {
    fontSize: 9,
    marginBottom: 2
  }
});
export const notesAndTotalsStyles = StyleSheet.create({
  NotesandTotals: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5
  },
  Notes: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    textAlign: 'justify',
    backgroundColor: '#f5f5f5',
    width: '68%',
    padding: 5,
    borderRadius: 5
  },
  Title: {
    fontSize: 11,
    marginBottom: 2,
    fontFamily: 'Bold'
  },
  Text: {
    display: 'flex',
    flexDirection: 'row',
    alignContent: 'center',
    marginBottom: 2
  },
  Bold: {
    fontSize: 9,
    marginBottom: 2,
    marginRight: 5,
    fontFamily: 'Bold'
  },
  Normal: {
    fontSize: 9,
    marginBottom: 2,
    fontFamily: 'Regular'
  },
  BoldItalic: {
    fontSize: 9,
    fontFamily: 'BoldItalic',
    whiteSpace: 'nowrap',
    wordBreak: 'no'
  },
  totals: {
    display: 'flex',
    flexDirection: 'column',
    alignSelf: 'flex-start',
    justifyContent: 'space-between',
    textAlign: 'justify',
    width: '30%'
  },
  totalsRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'center',
    marginBottom: 2,
    padding: 2
  },
  totalsTitle: {
    fontSize: 10,
    marginBottom: 2,
    fontFamily: 'Bold'
  },
  totalsValue: {
    fontSize: 10,
    marginBottom: 2,
    fontFamily: 'Regular',
    marginRight: 5
  },
  line: {
    borderBottomColor: '#9e9e9e',
    borderBottomWidth: 1,
    marginBottom: 3
  },

  totalsOddRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'center',
    marginBottom: 2,
    backgroundColor: '#f5f5f5',
    padding: 2
  }
});
export const signaturesStyles = StyleSheet.create({
  topFooter: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    height: 80
  },
  clientSignature: {
    display: 'flex',
    flexDirection: 'column',
    whiteSpace: 'nowrap',
    textAlign: 'justify',
    width: '40%',
    border: 1,
    borderColor: 'black',
    padding: 5,
    borderRadius: 5
  },
  clientSignatureText: {
    fontSize: 8,
    marginBottom: 2,
    fontFamily: 'Regular'
  },
  ctpcSignature: {
    display: 'flex',
    flexDirection: 'column',
    whiteSpace: 'nowrap',
    textAlign: 'justify',
    width: '30%'
  },
  ctpcSignatureText: {
    fontSize: 8,
    marginBottom: 2,
    fontFamily: 'Bold',
    textAlign: 'center'
  },
  signatureimage: {
    width: 120,
    height: 50,
    marginTop: 5,
    alignSelf: 'center'
  }
});
export const footerStyles = StyleSheet.create({
  footer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    textAlign: 'center'
  },
  thankYou: {
    display: 'flex',
    flexDirection: 'column',
    position: 'absolute',
    bottom: 70,
    left: 20,
    right: 20,
    marginBottom: 5
  },
  footerInfo: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    textAlign: 'center'
  },
  Title: {
    fontSize: 10,
    marginBottom: 2,
    fontFamily: 'Bold',
    textAlign: 'center'
  },
  Text: {
    fontSize: 8,
    marginBottom: 2,
    fontFamily: 'Bold',
    textAlign: 'center'
  },
  pageNumber: {
    fontSize: 10,
    marginBottom: 2,
    fontFamily: 'Italic',
    textAlign: 'center'
  },
  footerLine: {
    borderBottomColor: '#9e9e9e',
    borderBottomWidth: 1,
    marginBottom: 3
  }
});
export const tableHeaderStyles = StyleSheet.create({
  Header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'center',
    marginBottom: 5
  },
  Cell: {
    display: 'flex',
    flexDirection: 'column',
    whiteSpace: 'nowrap',
    textAlign: 'left',
    alignContent: 'center',
    padding: 5,
    backgroundColor: '#f5f5f5',
    borderRadius: 5
  },
  Text: {
    fontSize: 9,
    marginBottom: 2,
    fontFamily: 'Bold'
  }
});
export const tableBodyStyles = StyleSheet.create({
  Body: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignContent: 'center',
    marginBottom: 5
  },
  Row: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'center',
    marginBottom: 2
  },
  OddRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'center',
    marginBottom: 2,
    backgroundColor: '#f5f5f5'
  },
  Cell: {
    display: 'flex',
    flexDirection: 'column',
    whiteSpace: 'nowrap',
    textAlign: 'left',
    padding: 5
  },
  Text: {
    fontSize: 9,
    marginBottom: 2,
    fontFamily: 'Regular'
  },
  designation: {
    display: 'flex',
    flexDirection: 'flex-column'
  },
  Note: {
    fontSize: 8,
    fontFamily: 'Italic'
  }
});
export const styles = StyleSheet.create({
  body: {
    paddingTop: 35,
    paddingBottom: 75,
    paddingHorizontal: 35,
    fontFamily: 'Regular'
  },
  Link: {
    color: 'black',
    textDecoration: 'none'
  },

  line: {
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
    marginBottom: 3
  },
  h2: {
    fontSize: 12,
    fontFamily: 'Regular'
  },
  h3: {
    fontSize: 11,
    fontFamily: 'Regular'
  },
  p: {
    fontSize: 9,
    fontFamily: 'Regular',
    marginBottom: 1,
    whiteSpace: 'nowrap'
  },
  strong: {
    fontFamily: 'Bold',
    whiteSpace: 'nowrap'
  },
  strongem: {
    fontFamily: 'BoldItalic',
    whiteSpace: 'nowrap'
  },
  em: {
    fontFamily: 'Italic',
    whiteSpace: 'nowrap'
  },
  u: {
    textDecoration: 'underline',
    whiteSpace: 'nowrap'
  },
  ul: {
    margin: 0,
    padding: 0,
    marginBottom: 2
  },
  li: {
    marginLeft: 10,
    fontSize: 9,
    fontFamily: 'Regular',
    whiteSpace: 'nowrap'
  },
  ol: {
    margin: 0,
    padding: 0,
    marginBottom: 2
  }
});

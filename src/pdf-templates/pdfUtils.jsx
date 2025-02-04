import { Text, View } from '@react-pdf/renderer';
export const htmlToReactPDF = (htmlString, styles) => {
  const div = document.createElement('div');
  div.innerHTML = htmlString;

  const parseNode = (node, index, isListItem = false, isOrderedList = false, isStrongParent = false) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }

    const children = Array.from(node.childNodes).map((child, idx) =>
      parseNode(child, idx, isListItem, isOrderedList, isStrongParent || node.nodeName.toLowerCase() === 'strong')
    );

    switch (node.nodeName.toLowerCase()) {
      case 'h2':
        return (
          <Text key={index} style={styles.h2}>
            {children}
          </Text>
        );
      case 'h3':
        return (
          <Text key={index} style={styles.h3}>
            {children}
          </Text>
        );
      case 'p': {
        const emptyParagraph = children[0]?.props?.children.length === 0;
        return emptyParagraph ? (
          <View key={index} style={{ height: 10 }} />
        ) : (
          <Text key={index} style={styles.p}>
            {children}
          </Text>
        );
      }

      case 'strong': {
        return (
          <Text key={index} style={styles.strong}>
            {children}
          </Text>
        );
      }
      case 'em': {
        return (
          <Text key={index} style={isStrongParent ? styles.strongem : styles.em}>
            {children}
          </Text>
        );
      }
      case 'u':
        return (
          <Text key={index} style={styles.u}>
            {children}
          </Text>
        );
      case 'li': {
        return (
          <Text key={index} style={styles.li}>
            {children}
          </Text>
        );
      }
      case 'ul': {
        return (
          <View key={index} style={styles.ul}>
            {children.map((child, idx) => (
              <Text key={idx} style={styles.li}>
                • {child}
              </Text>
            ))}
          </View>
        );
      }
      case 'ol': {
        return (
          <View key={index} style={styles.ol}>
            {children.map((child, idx) => (
              <Text key={idx} style={styles.li}>
                {idx + 1}. {child}
              </Text>
            ))}
          </View>
        );
      }
      default:
        return <Text key={index}>{children}</Text>;
    }
  };

  return Array.from(div.childNodes).map((child, index) => {
    if (child.nodeName.toLowerCase() === 'ul') {
      return parseNode(child, index, true);
    }
    if (child.nodeName.toLowerCase() === 'ol') {
      return parseNode(child, index, true, true);
    }
    return parseNode(child, index);
  });
};

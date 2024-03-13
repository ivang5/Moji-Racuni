import React from "react";
import {
  Page,
  Text,
  Document,
  StyleSheet,
  Image,
  View,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#E4E4E4",
  },
  container: {
    flexDirection: "row",
    marginTop: 10,
    marginBottom: 10,
    marginRight: 5,
    marginLeft: 5,
  },
  halfWidth: {
    marginRight: 5,
    marginLeft: 5,
    width: "50%",
  },
});

const Review = ({ receiptPlots }) => {
  console.log(receiptPlots);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text>Section #1</Text>
        <Text>Section #2</Text>
        <View style={styles.container}>
          <Image
            src={`data:image/png;base64,${receiptPlots.daily}`}
            style={styles.halfWidth}
          />
          <Image
            src={`data:image/png;base64,${receiptPlots.monthly}`}
            style={styles.halfWidth}
          />
        </View>
        <Image src={`data:image/png;base64,${receiptPlots.hourly}`} />
      </Page>
    </Document>
  );
};

export default Review;

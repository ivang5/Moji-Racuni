import React from "react";
import {
  Page,
  Text,
  Document,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf",
      fontWeight: 300,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
      fontWeight: 400,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf",
      fontWeight: 500,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: 600,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
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
  title: {
    marginLeft: 10,
    marginBottom: 25,
    paddingBottom: 2,
    maxWidth: 127,
    fontSize: 22,
    borderBottomWidth: 2,
    borderBottomColor: "#23c363",
  },
});

const Review = ({ receiptPlots }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>- Broj računa</Text>
        <Image src={`data:image/png;base64,${receiptPlots.receipts}`} />
      </Page>
    </Document>
  );
};

export default Review;

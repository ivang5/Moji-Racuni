import React from "react";
import {
  Page,
  View,
  Text,
  Document,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";
import { formatPrice, dateFormatter } from "../utils/utils";
import Logo from "../icons/logo/Logo_bg_color.png";

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
  thirdWidth: {
    marginLeft: 5,
    marginRight: 5,
    width: "33%",
    textAlign: "center",
  },
  title: {
    marginTop: 10,
    fontSize: 32,
    textAlign: "center",
    fontWeight: "bold",
  },
  statType: {
    fontSize: 20,
    textAlign: "center",
    fontWeight: "bold",
  },
  statDate: {
    marginTop: 5,
    marginBottom: 30,
    fontSize: 14,
    textAlign: "center",
  },
  subTitle: {
    marginTop: 20,
    marginBottom: 25,
    marginLeft: 10,
    paddingBottom: 2,
    maxWidth: 127,
    fontSize: 22,
    borderBottomWidth: 2,
    borderBottomColor: "#23c363",
  },
  infoGroup: {
    display: "flex",
    flexDirection: "row",
    marginRight: 7,
    marginLeft: 7,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "#23c36333",
    borderRadius: 20,
  },
  infoTitle: {
    fontSize: 14,
    color: "#979595",
  },
  infoVal: {
    fontSize: 20,
  },
  footer: {
    position: "absolute",
    bottom: 10,
    left: 15,
    right: 15,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignContent: "center",
    marginTop: 10,
  },
  footerBrand: {
    display: "flex",
    flexDirection: "row",
  },
  footerText: {
    marginTop: 4,
    marginLeft: 12,
    fontSize: 12,
  },
  footerAddress: {
    marginTop: 4,
    fontSize: 12,
  },
  logo: {
    height: 25,
    width: 25,
  },
});

const Review = ({ receiptPlots, baseStats, fromDate, toDate }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Pregled statistike</Text>
        <Text style={styles.statType}>– Računi –</Text>
        <Text style={styles.statDate}>
          {dateFormatter(fromDate)} - {dateFormatter(toDate)}
        </Text>
        <View style={styles.infoGroup}>
          <View style={styles.thirdWidth}>
            <Text style={styles.infoTitle}>Ukupan broj računa</Text>
            <Text style={styles.infoVal}>
              {baseStats.totalSpent.receiptsCount}
            </Text>
          </View>
          <View style={styles.thirdWidth}>
            <Text style={styles.infoTitle}>Najveći račun</Text>
            <Text style={styles.infoVal}>
              {baseStats.totalSpent.mostSpentReceipt
                ? formatPrice(baseStats.totalSpent.mostSpentReceipt)
                : 0}{" "}
              RSD
            </Text>
          </View>
          <View style={styles.thirdWidth}>
            <Text style={styles.infoTitle}>Prosečna vrednost računa</Text>
            <Text style={styles.infoVal}>
              {baseStats.totalSpent.avgSpentReceipt
                ? formatPrice(baseStats.totalSpent.avgSpentReceipt)
                : 0}{" "}
              RSD
            </Text>
          </View>
        </View>
        <Text style={styles.subTitle}>- Broj računa</Text>
        <Image src={`data:image/png;base64,${receiptPlots.receipts}`} />
        <View style={styles.footer}>
          <View style={styles.footerBrand}>
            <Image src={Logo} style={styles.logo} />
            <Text style={styles.footerText}>Moji Računi</Text>
          </View>
          <Text style={styles.footerAddress}>address placeholder</Text>
        </View>
      </Page>
    </Document>
  );
};

export default Review;

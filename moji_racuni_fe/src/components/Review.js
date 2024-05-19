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
    marginLeft: 2,
    marginRight: 2,
    width: "33%",
    textAlign: "center",
  },
  title: {
    marginTop: 10,
    fontSize: 28,
    textAlign: "center",
    fontWeight: "bold",
  },
  statType: {
    fontSize: 16,
    textAlign: "center",
    fontWeight: "bold",
  },
  statDate: {
    marginTop: 5,
    marginBottom: 30,
    fontSize: 12,
    textAlign: "center",
  },
  subTitle: {
    marginTop: 20,
    marginBottom: 25,
    marginLeft: 10,
    paddingBottom: 2,
    maxWidth: 117,
    fontSize: 19,
    borderBottomWidth: 2,
    borderBottomColor: "#23c363",
  },
  subTitleSpending: {
    maxWidth: 100,
  },
  subTitleCompanies: {
    maxWidth: 108,
  },
  subTitleTypes: {
    maxWidth: 165,
  },
  subTitleItems: {
    maxWidth: 142,
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
    marginBottom: 2,
    fontSize: 11,
    color: "#979595",
  },
  infoVal: {
    fontSize: 16,
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

const Review = ({ statPlots, baseStats, fromDate, toDate }) => {
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
        <Image src={`data:image/png;base64,${statPlots.receipts}`} />
        <View style={styles.footer}>
          <View style={styles.footerBrand}>
            <Image src={Logo} style={styles.logo} />
            <Text style={styles.footerText}>Moji Računi</Text>
          </View>
          <Text style={styles.footerAddress}>address placeholder</Text>
        </View>
      </Page>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Pregled statistike</Text>
        <Text style={styles.statType}>– Potrošnja –</Text>
        <Text style={styles.statDate}>
          {dateFormatter(fromDate)} - {dateFormatter(toDate)}
        </Text>
        <View style={styles.infoGroup}>
          <View style={styles.thirdWidth}>
            <Text style={styles.infoTitle}>Ukupno potrošeno</Text>
            <Text style={styles.infoVal}>
              {baseStats.totalSpent.totalSpent
                ? formatPrice(baseStats.totalSpent.totalSpent)
                : 0}{" "}
              RSD
            </Text>
          </View>
          <View style={styles.thirdWidth}>
            <Text style={styles.infoTitle}>Potrošeno na PDV</Text>
            <Text style={styles.infoVal}>
              {baseStats.totalSpent.totalSpentVat
                ? formatPrice(baseStats.totalSpent.totalSpentVat)
                : 0}{" "}
              RSD
            </Text>
          </View>
          <View style={styles.thirdWidth}>
            <Text style={styles.infoTitle}>
              Najviše potrošeno u jednom danu
            </Text>
            <Text style={styles.infoVal}>
              {baseStats.mostSpentInADay.mostSpent
                ? formatPrice(baseStats.mostSpentInADay.mostSpent)
                : 0}{" "}
              RSD
            </Text>
          </View>
        </View>
        <Text style={[styles.subTitle, styles.subTitleSpending]}>
          - Potrošnja
        </Text>
        <Image src={`data:image/png;base64,${statPlots.spending}`} />
        <View style={styles.footer}>
          <View style={styles.footerBrand}>
            <Image src={Logo} style={styles.logo} />
            <Text style={styles.footerText}>Moji Računi</Text>
          </View>
          <Text style={styles.footerAddress}>address placeholder</Text>
        </View>
      </Page>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Pregled statistike</Text>
        <Text style={styles.statType}>– Preduzeća –</Text>
        <Text style={styles.statDate}>
          {dateFormatter(fromDate)} - {dateFormatter(toDate)}
        </Text>
        <View style={styles.infoGroup}>
          <View style={styles.thirdWidth}>
            <Text style={styles.infoTitle}>Najposećenije preduzeće</Text>
            <Text style={styles.infoVal}>
              {baseStats.MostVisitedCompaniesInfo[0].companyName}
            </Text>
          </View>
          <View style={styles.thirdWidth}>
            <Text style={styles.infoTitle}>Broj posećenih preduzeća</Text>
            <Text style={styles.infoVal}>
              {baseStats.visitedCompaniesInfo.companyCount}
            </Text>
          </View>
          <View style={styles.thirdWidth}>
            <Text style={styles.infoTitle}>Broj posećenih prodajnih mesta</Text>
            <Text style={styles.infoVal}>
              {baseStats.visitedCompaniesInfo.unitCount}
            </Text>
          </View>
        </View>
        <Text style={[styles.subTitle, styles.subTitleCompanies]}>
          - Preduzeća
        </Text>
        <Image src={`data:image/png;base64,${statPlots.companies}`} />
        <View style={styles.footer}>
          <View style={styles.footerBrand}>
            <Image src={Logo} style={styles.logo} />
            <Text style={styles.footerText}>Moji Računi</Text>
          </View>
          <Text style={styles.footerAddress}>address placeholder</Text>
        </View>
      </Page>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Pregled statistike</Text>
        <Text style={styles.statType}>– Tipovi preduzeća –</Text>
        <Text style={styles.statDate}>
          {dateFormatter(fromDate)} - {dateFormatter(toDate)}
        </Text>
        <View style={styles.infoGroup}>
          <View style={styles.thirdWidth}>
            <Text style={styles.infoTitle}>Najposećenije preduzeće</Text>
            <Text style={styles.infoVal}>
              {baseStats.MostVisitedCompaniesInfo[0].companyName}
            </Text>
          </View>
          <View style={styles.thirdWidth}>
            <Text style={styles.infoTitle}>Broj posećenih preduzeća</Text>
            <Text style={styles.infoVal}>
              {baseStats.visitedCompaniesInfo.companyCount}
            </Text>
          </View>
          <View style={styles.thirdWidth}>
            <Text style={styles.infoTitle}>Broj posećenih prodajnih mesta</Text>
            <Text style={styles.infoVal}>
              {baseStats.visitedCompaniesInfo.unitCount}
            </Text>
          </View>
        </View>
        <Text style={[styles.subTitle, styles.subTitleTypes]}>
          - Tipovi preduzeća
        </Text>
        <Image src={`data:image/png;base64,${statPlots.types}`} />
        <View style={styles.footer}>
          <View style={styles.footerBrand}>
            <Image src={Logo} style={styles.logo} />
            <Text style={styles.footerText}>Moji Računi</Text>
          </View>
          <Text style={styles.footerAddress}>address placeholder</Text>
        </View>
      </Page>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Pregled statistike</Text>
        <Text style={styles.statType}>– Stakve –</Text>
        <Text style={styles.statDate}>
          {dateFormatter(fromDate)} - {dateFormatter(toDate)}
        </Text>
        <View style={styles.infoGroup}>
          <View style={styles.thirdWidth}>
            <Text style={styles.infoTitle}>Najskuplja stavka</Text>
            <Text style={styles.infoVal}>
              {baseStats.mostValuableItems[0].name}
            </Text>
          </View>
          <View style={styles.thirdWidth}>
            <Text style={styles.infoTitle}>
              Najviše stavki na jednom računu
            </Text>
            <Text style={styles.infoVal}>{baseStats.mostItems.mostItems}</Text>
          </View>
          <View style={styles.thirdWidth}>
            <Text style={styles.infoTitle}>Prosečan broj stavki na računu</Text>
            <Text style={styles.infoVal}>
              {Math.round(baseStats.mostItems.avgItems)}
            </Text>
          </View>
        </View>
        <Text style={[styles.subTitle, styles.subTitleItems]}>
          - Stavke računa
        </Text>
        <Image src={`data:image/png;base64,${statPlots.items}`} />
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

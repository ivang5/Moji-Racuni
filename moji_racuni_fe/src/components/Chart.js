import React, { useEffect } from "react";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import { formatChartVal, formatPrice } from "../utils/utils";
import { useState } from "react";

const Chart = ({
  type,
  data,
  keys,
  index,
  tooltip,
  title,
  desktop,
  customAxis,
}) => {
  const [pieChartSettings, setPieChartSettings] = useState({});

  useEffect(() => {
    const handleWindowResize = () => {
      if (
        (window.innerWidth < 768 ||
          (window.innerWidth >= 992 && window.innerWidth < 1200)) &&
        pieChartSettings.anchor !== "bottom"
      ) {
        setPieChartSettings({
          margin: { top: 4, right: 0, bottom: 360, left: 1 },
          anchor: "bottom",
          translateX: -70,
          translateY: 290,
        });
      } else if (
        ((window.innerWidth >= 768 && window.innerWidth < 992) ||
          window.innerWidth >= 1200) &&
        pieChartSettings.anchor !== "right"
      ) {
        setPieChartSettings({
          margin: { top: 4, right: 200, bottom: 100, left: 4 },
          anchor: "right",
          translateX: 50,
          translateY: 0,
        });
      }
    };

    handleWindowResize();

    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  });

  const theme = {
    axis: {
      legend: {
        text: {
          fontSize: 14,
          fill: "#333333",
        },
      },
    },
  };

  const colors = [
    "#8dd3c7",
    "#ffffb3",
    "#bebada",
    "#fb8072",
    "#80b1d3",
    "#fdb462",
    "#b3de69",
    "#fccde5",
    "#bc80bd",
    "#ccebc5",
    "#d9d9d9",
  ];

  return (
    <div
      className={`statistics__chart${
        desktop ? " statistics__chart--desktop" : ""
      }${index === "month" ? " statistics__chart--three-fifths" : ""}${
        index === "dayofweek" ? " statistics__chart--two-fifths" : ""
      }${index === "name" ? " statistics__chart--full" : ""}${
        type === "pie" ? " statistics__chart--pie" : ""
      }`}
    >
      <h3
        className={`statistics__chart-title${
          type === "pie" ? " statistics__chart-title--pie" : ""
        }`}
      >
        {title}
      </h3>
      {type === "bar" && (
        <div className="statistics__chart-content">
          <ResponsiveBar
            data={data}
            theme={theme}
            keys={keys}
            indexBy={index}
            margin={{ top: 50, right: 0, bottom: 105, left: 36 }}
            padding={0.4}
            valueScale={{ type: "linear" }}
            colors="#23c363"
            animate={true}
            enableLabel={false}
            motionConfig="gentle"
            defs={[
              {
                id: "lines",
                type: "patternLines",
                background: "inherit",
                color: "#0cb44f",
                rotation: -45,
                lineWidth: 6,
                spacing: 10,
              },
              {
                id: "dots",
                type: "patternDots",
                background: "inherit",
                color: "#0cb44f",
                size: 4,
                padding: 1,
                stagger: true,
              },
            ]}
            fill={[
              {
                match: {
                  id: "count",
                },
                id: "lines",
              },
              {
                match: {
                  id: "spent",
                },
                id: "dots",
              },
              {
                match: {
                  id: "receiptCount",
                },
                id: "dots",
              },
              {
                match: {
                  id: "price",
                },
                id: "dots",
              },
            ]}
            tooltip={({ index, value }) => (
              <div
                className={`statistics__chart-tooltip${
                  keys[0] === "price"
                    ? " statistics__chart-tooltip--custom"
                    : ""
                }`}
              >
                <strong>
                  {keys[0] === "price" && (
                    <>
                      {data[index].name}
                      <br />
                    </>
                  )}
                  <div className={keys[0] === "price" ? "pt-1" : ""}>
                    {keys[0] === "spent" || keys[0] === "price"
                      ? `${formatPrice(value)} RSD`
                      : value}
                  </div>
                </strong>
              </div>
            )}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              format: (v) => {
                return v.length > 20 && customAxis ? (
                  <tspan>
                    {v.substring(0, 17) + "..."}
                    <title>{v}</title>
                  </tspan>
                ) : (
                  v
                );
              },
              tickRotation: customAxis ? -55 : 0,
            }}
            axisLeft={{
              format: (e) => {
                if (Math.floor(e) === e) {
                  if (e > 999) {
                    return formatChartVal(e);
                  }
                  return e;
                }
                return "";
              },
            }}
          />
        </div>
      )}
      {type === "pie" && (
        <div className="statistics__chart-content">
          <ResponsivePie
            data={data}
            margin={pieChartSettings.margin}
            innerRadius={0.4}
            padAngle={0.7}
            cornerRadius={3}
            activeOuterRadiusOffset={3}
            borderWidth={1}
            colors={colors}
            borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
            enableArcLinkLabels={false}
            arcLabel={(e) => {
              if (e.value > 999) {
                return formatChartVal(e.value);
              }
              return e.value;
            }}
            arcLinkLabelsSkipAngle={10}
            arcLinkLabelsTextColor="#333333"
            arcLinkLabelsThickness={2}
            arcLinkLabelsColor={{ from: "color" }}
            arcLabelsSkipAngle={5}
            arcLabelsTextColor={{
              from: "color",
              modifiers: [["darker", 4]],
            }}
            tooltip={(e) => (
              <div className="statistics__chart-tooltip statistics__chart-tooltip--pie">
                <strong>
                  {e.datum.id}: <br />
                  {tooltip === "cena" && `${formatPrice(e.datum.value)} RSD`}
                  {tooltip === "broj" && `${e.datum.value} Računa`}
                </strong>
              </div>
            )}
            legends={[
              {
                dataFrom: "data",
                data: data.map((item, index) => ({
                  color: colors[index],
                  item,
                  label:
                    item.id.length > 37
                      ? item.id.substring(0, 35) + "..."
                      : item.id,
                })),
                anchor: pieChartSettings.anchor,
                direction: "column",
                justify: false,
                translateX: pieChartSettings.translateX,
                translateY: pieChartSettings.translateY,
                itemsSpacing: 0,
                itemWidth: 40,
                itemHeight: 25,
                itemTextColor: "#333",
                itemDirection: "left-to-right",
                itemOpacity: 1,
                symbolSize: 18,
                symbolShape: "circle",
              },
            ]}
          />
        </div>
      )}
    </div>
  );
};

export default Chart;

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import {
  BarChart,
} from 'react-native-chart-kit'
import {SelectDropdown, DropdownData} from "expo-select-dropdown";

const App = () => {
  const [data, setData] = useState([])
  const [year, setYear] = useState(0)
  const [paramId, setParamId] = useState(0)
  const [db, setDb] = useState()
  const [maximum, setMaximum] = useState(0) 
  const [minimum, setMinimum] = useState(0) 
  const [average, setAverage] = useState(0) 
  const [years] = useState([  
      {key: "1", value: 2011}, 
      {key: "2", value: 2012}, 
      {key: "3", value: 2013},  
      {key: "4", value: 2014}, 
      {key: "5", value: 2015}, 
      {key: "6", value: 2016},  
      {key: "7", value: 2017}, 
      {key: "8", value: 2018}
  ]);
  const [parameters] = useState([  
    {key: 1, value: "Average temperate in Celcius"}, 
    {key: 2, value: "Average wind speed in km/h"}, 
    {key: 3, value: "Direction from where the wind is coming from in degrees"},  
    {key: 4, value: "Total rainfall in millimeters"}, 
    {key: 5, value: "Average relative humidity"}, 
    {key: 6, value: "Distance in kilometers"},  
    {key: 7, value: "Air pressure in millibar"}, 
    {key: 8, value: "Percentage of the sky which is covered by cloud"},
    {key: 9, value: "Temperate in Celcius"},
    {key: 10, value: "Maximum recorded wind speed in km/h"}
  ]);
  const [labels, setLabels] = useState(['J', 'F', 'M', 'A', 'M', 'J','J', 'A', 'S', 'O', 'N', 'D'])

  useEffect(() => {
    openDatabase()
  }, []);

  async function openDatabase() {
    if (!(await FileSystem.getInfoAsync(FileSystem.documentDirectory + 'SQLite')).exists) {
      await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'SQLite');
    }
    await FileSystem.downloadAsync(
      Asset.fromModule(require("./assets/database/weather_data.db")).uri,
      FileSystem.documentDirectory + 'SQLite/weather_data.db'
    );
    await setDb(await SQLite.openDatabase('weather_data.db'));
  }

  const getValues = (year, parameter) => {
    if (db && year!= 0 && parameter != 0){
      if (year == 2011){
        setLabels(['J', 'A', 'S', 'O', 'N', 'D'])
      }
      else if (year == 2018){
        setLabels(['J', 'F', 'M', 'A', 'M', 'J','J', 'A', 'S', 'O'])
      }
      else {
        setLabels(['J', 'F', 'M', 'A', 'M', 'J','J', 'A', 'S', 'O', 'N', 'D'])
      }
      db.transaction(tx => {
        tx.executeSql(
          `SELECT strftime('%m', timestamp) as month, AVG(value)
          FROM data
          WHERE strftime('%Y', timestamp) = '${year}'
          AND param_id = '${parameter}'
          GROUP BY strftime('%m', timestamp);                 
          `,
          [], (trans, result) => {
            setData([])
            const averages = []
            for (let i = 0; i < result.rows.length; i++) {
              averages.push(result.rows.item(i)["AVG(value)"]);
            }
            setData(averages)
          });
          tx.executeSql(
            `SELECT MAX(value) as max_item
            FROM data
            WHERE strftime('%Y', timestamp) = '${year}'
            AND param_id = '${parameter}';                
            `,
            [year, parameter],
              (_, { rows: { _array } }) => {
                setMaximum(_array[0].max_item);
          });
          tx.executeSql(
            `SELECT MIN(value) as min_item
            FROM data
            WHERE strftime('%Y', timestamp) = '${year}'
            AND param_id = '${parameter}';                
            `,
            [year, parameter],
              (_, { rows: { _array } }) => {
                setMinimum(_array[0].min_item);
          });
          tx.executeSql(
            `SELECT AVG(value) as avg_item
            FROM data
            WHERE strftime('%Y', timestamp) = '${year}'
            AND param_id = '${parameter}';                
            `,
            [year, parameter],
              (_, { rows: { _array } }) => {
                setAverage(_array[0].avg_item);
          });

      });
    }
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Weather Data</Text>
      <View style={styles.dropdownContainer}>
        <SelectDropdown  
          data={years}  
              placeholder={"Select year"}  
              selected={year}  
              setSelected={(year) => {
                setYear(year)
                getValues(year.value, paramId?.key || 0)}}  
              searchOptions={{cursorColor: "#007bff"}}  
              searchBoxStyles={{borderColor: "#007bff"}}  
              dropdownStyles={{borderColor: "#007bff"}}  
        />
        <SelectDropdown  
        data={parameters}  
            placeholder={"Select parameter"}  
            selected={paramId}  
            setSelected={(id) => {
              setParamId(id)
              getValues(year?.value || 0, id.key)}}  
            searchOptions={{cursorColor: "#007bff"}}  
            searchBoxStyles={{borderColor: "#007bff"}}  
            dropdownStyles={{borderColor: "#007bff"}}  
        />
      </View>
      <Text style={styles.heading}>Monthly Averages</Text>
      <BarChart
        data={{
          labels:  labels,
          datasets: [{
            data: data
          }]
        }}
        width={Dimensions.get('window').width* 0.9} // from react-native
        height={220}
        chartConfig={{
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          decimalPlaces: 0,
          style: {},
          propsForLabels: {},
          barPercentage: .3
        }}
        style={{
          marginVertical: 8,
          borderRadius: 16
        }}
      />
      <Text style={styles.heading}>Summary</Text>
      <View style={styles.summaryContainer}>
        <View>
          <View style={[styles.card, { backgroundColor: "#00308F" }]}>
            <Image style={styles.cardImage} source={{ uri: "https://img.icons8.com/external-flat-icons-inmotus-design/512/external-bar-economic-charts-flat-icons-inmotus-design-3.png" }} />
            <Text style={[styles.title, { color: '#F8F8F8' }]}>{maximum}</Text>
          </View>
          <View style={styles.cardHeader}>
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[styles.title, { color: "#00308F" }]}>Maximum</Text>
          </View>
          </View>
        </View>
        <View>
          <View style={[styles.card, { backgroundColor: "#ffcc00" }]}>
          <Image style={styles.cardImage} source={{ uri: "https://img.icons8.com/ios-filled/512/bar-chart.png" }} />
            <Text style={[styles.title, { color: '#F8F8F8' }]}>{average.toFixed(2)}</Text>
          </View>
          <View style={styles.cardHeader}>
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[styles.title, { color: "#ffcc00" }]}>Average</Text>
          </View>
          </View>
        </View>
        <View>
          <View style={[styles.card, { backgroundColor: "#33cc33" }]}>
          <Image style={styles.cardImage} source={{ uri: "https://img.icons8.com/external-flat-icons-inmotus-design/512/external-bar-economic-charts-flat-icons-inmotus-design.png" }} />
            <Text style={[styles.title, { color: '#F8F8F8' }]}>{minimum}</Text>
          </View>
          <View style={styles.cardHeader}>
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[styles.title, { color: "#33cc33" }]}>Minimum</Text>
          </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "#C0C0C0"
  },
  dropdownContainer: {
    padding:15,
  },
  heading: {
    fontSize: 24,
    alignSelf: 'center',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    alignSelf: 'center',
    fontWeight: 'bold',
  },
  card: {
    shadowColor: '#474747',
    backgroundColor: '#FF4500',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,

    elevation: 12,
    marginVertical: 20,
    marginHorizontal: 15,
    backgroundColor: '#e2e2e2',
    width: 80,
    height: 80,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryContainer: {
    flexDirection: "row"
  },
  cardImage: {
    height: 30,
    width: 30,
    alignSelf: 'center',
  }
});

export default App;

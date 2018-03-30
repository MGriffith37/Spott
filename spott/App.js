import React from 'react';
import { Alert, Animated, StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, Button, TouchableHighlight} from 'react-native';
//  import {Constants, MapView} from 'expo';
 import MapView from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import axios from 'axios';

const GOOGLE_MAPS_API_KEY= "AIzaSyCoef2TGnJKm3xQcIqSafDY8gkBTSDqIgY";
const LATITUDE_DELTA = 0.02;
const LONGITUDE_DELTA = 0.02;

const initialRegion = {
  latitude: -36.8485, 
  longitude: 174.7633, 
  latitudeDelta: 0.5, 
  longitudeDelta: 0.5 
}

export default class App extends React.Component {
      map = null;

  constructor(props) {
    super(props);
  this.state = {
    locationInput: '',
    locationCoordinates: {},
    region: {},
    userLocation: {},
    markers: [],
    updatedMarkers:[],
    currentMarker: {coordinate: {latitude: -36.84808, longitude: 174.7626}},
    navigationOn : false,
    ready: true,
  };
  this.handleLocationInput = this.handleLocationInput.bind(this);
  this.handleLocationChange = this.handleLocationChange.bind(this);
  this.processParks = this.processParks.bind(this);
}
  
setRegion(region) {
  if(this.state.ready) {
    setTimeout(() => this.map.animateToRegion(region), 10);
  }
  this.setState({ region });
}

  _handleMapRegionChange = mapRegion => {
    this.setState({ mapRegion });
  };
  
  processParks(element){
    var pattern = /\s*,\s*/;
    var coordinates = element.coordinates.split(pattern);
    var latitude = parseFloat(coordinates[0]);
    var longitude = parseFloat(coordinates[1]);
    //var title = "Park at " + latitude + ", " + longitude;
    var title = "Park at Microsoft Office, Auckland";
    var description = element.availability ? "This park is available" : "This park is unavailable";
    var availability = element.availability;

    var carparkMarker = {coordinate: {latitude,longitude}, title, description, availability};
    this.state.updatedMarkers.push(carparkMarker);
    console.log("gdayy gday",this.state.updatedMarkers);
  }

  componentDidMount(){
    console.log('Component did mount');
    this.getCurrentPosition();
    fetch('http://spott.azurewebsites.net/api/SpottAPI', {
      method: 'GET'
    })
    .then((response) => response.json())
    .then((responseJson) => {
      responseJson.forEach(this.processParks);
      this.setState({markers: this.state.updatedMarkers});
    })
    .catch((error) =>{
      console.error(error);
    });

    this.interval = setInterval(() => {    
    this.getCurrentPosition(), fetch('http://spott.azurewebsites.net/api/SpottAPI', {
      method: 'GET'
    })
    .then((response) => response.json())
    .then((responseJson) => {
      this.setState({updatedMarkers: []})
      responseJson.forEach(this.processParks);
      this.setState({markers: this.state.updatedMarkers});
    })
    .catch((error) =>{
      console.error(error);
    })}, 1000);
}

getCurrentPosition() {
  try {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const region = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        };
        this.setState({userLocation: region});
      },
      (error) => {
            Alert.alert(error.message, "Error detecting your location");
      }
    );
  } catch(e) {
    alert(e.message || "");
  }
};

onMapReady = (e) => {
  if(!this.state.ready) {
    this.setState({ready: true});
  }
};

onRegionChange = (region) => {
  console.log('onRegionChange', region);
  this.setState({
    locationCoordinates: region
  });
};

onRegionChangeComplete = (region) => {
  console.log('onRegionChangeComplete', region);
};

handleLocationInput(textInput) {
  this.setState({
    locationInput: textInput
  });
}

updateLocationCoordinates(response){
  var info = response.data.results[0].geometry.location 
  console.log("whats this then? ",info);
  this.setState({
    region: {
      latitude: info.lat,
      longitude: info.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }
    
  })
  setTimeout(() => this.map.animateToRegion(this.state.region), 10);

}

handleSubmit(textInput) {
  axios.get("https://maps.googleapis.com/maps/api/geocode/json?address=" + this.state.locationInput.split(' ').join('') + "&key=" + GOOGLE_MAPS_API_KEY)
  .then(response => this.updateLocationCoordinates(response))
  .catch(error => Alert.alert("Unable to located address"))
}

handleLocationChange(response){
  this.setState({
    locationCoordinates: response
  });
}

render() {
  console.log("current marker", this.state.currentMarker);
  const { region, markers } = this.state;
  
  return (
    <View style={styles.overallViewContainer}>
      <MapView
      showsUserLocation
      ref={map => {this.map = map}}
      mapType = "mutedStandard"
      style={styles.container}
      initialRegion={initialRegion}
      onRegionChange={this.onRegionChange}
      scrollEnabled = {true}
      zoomEnabled = {true}
      textStyle={{ color: '#bc8b00' }}
      containerStyle={{backgroundColor: 'white', borderColor: '#BC8B00'}}
      onMapReady={this.onMapReady}
      onRegionChangeComplete={this.onRegionChangeComplete}
      showsPointsOfInterest={false}
     >
       {markers.map((marker, index) => {
        return (
          <MapView.Marker 
          key={index}
          onPress={() => {
            this.setState({
              region: {
                latitude: marker.coordinate.latitude,
                longitude: marker.coordinate.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
             },
             navigationOn : true,
             currentMarker: marker
            }
            );
            if(this.state.navigationOn && this.state.currentMarker === marker){
              this.setState({navigationOn: false});
            }
            setTimeout(() => this.map.animateToRegion(this.state.region), 10);
          }}
          coordinate={marker.coordinate} 
          title={marker.title} 
          description={marker.description}
          pinColor = {marker.availability ? '#00cc00' : '#E50000'}
          >  
          </MapView.Marker>
          );
        })}

        <MapViewDirections
          origin = {{
            latitude: parseFloat(this.state.userLocation.latitude), 
            longitude: parseFloat(this.state.userLocation.longitude)}}
          destination={{
            latitude: this.state.navigationOn ? parseFloat(this.state.currentMarker.coordinate.latitude) : parseFloat(this.state.userLocation.latitude), 
            longitude: this.state.navigationOn ? parseFloat(this.state.currentMarker.coordinate.longitude) : parseFloat(this.state.userLocation.longitude)
          }}
          apikey={GOOGLE_MAPS_API_KEY}
          strokeWidth={2}
          onError={(errorMessage) => {
            console.ignoredYellowBox = ['Warning','MapViewDirections'];
          }}
        />
      </MapView>

      <View style={styles.inputView}>
        <TextInput
            placeholder="Where to?"
            style={styles.input}
            onChangeText={this.handleLocationInput}
            value={this.state.locationInput}
            onSubmitEditing={this.handleSubmit.bind(this)}
        />
      </View>

    </View>
  );
}
}

const styles = StyleSheet.create({
  overallViewContainer: {
    flex:1,
    justifyContent: 'center',
    backgroundColor: '#F5FCFF',
  },
  inputView: {
    backgroundColor: 'rgba(0,0,0,0)',
    position: 'absolute', 
    top: 0,
    left: 5,
    right: 5
},
input: {
    height: 48,
    padding: 10,
    marginTop: 72,
    marginLeft: 10,
    marginRight: 10,
    fontSize: 18,
    borderWidth: 2,
    borderRadius: 10,
    borderColor: '#48BBEC',
    backgroundColor: 'white',
},
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  allNonMapThings: {
    alignItems: 'center',
    height:'100%',
    width:'100%'
  },
  inputContainer: {
    elevation: 1,
    backgroundColor: 'white',
    width: '90%',
    height: '6%',
    top: 40,
    borderRadius: 3,
    shadowOpacity: 0.75,
    shadowRadius: 1,
    shadowColor: 'gray',
    shadowOffset: { height: 0, width: 0}
  },
  button: {
    elevation: 1,
    position: 'absolute',
    bottom: 25,
    backgroundColor: '#ff6600',
    borderRadius: 10,
    width: '60%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.75,
    shadowRadius: 1,
    shadowColor: 'gray',
    shadowOffset: { height: 0, width: 0}
  },
  buttonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',

  },
  wrapper: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  }
});

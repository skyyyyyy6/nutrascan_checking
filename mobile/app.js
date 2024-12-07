import React, { useState, useEffect, useRef } from 'react';
import { View, Button, Image, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Camera, CameraType } from 'expo-camera';  // Use expo-camera
import * as ImageManipulator from 'expo-image-manipulator';  // For image resizing and manipulation
import * as FileSystem from "expo-file-system";  // To handle file system operations
import axios from 'axios';


// Configure Axios Interceptors
axios.interceptors.request.use(
  (request) => {
    console.log("Request being sent to endpoint:", request.url);  // Log the endpoint URL
    console.log("Request details:", request);  // Log the full request
    return request;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    console.log("Intercepting response...");
    console.log("Response received from endpoint:", response.config.url);  // Log the endpoint URL for the response
    console.log("Response data:", response.data);  // Log the full response data
    return response;
  },
  (error) => {
    console.error("Response error:", error);
    return Promise.reject(error);
  }
);

const App = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [responseData, setResponseData] = useState(null);  // New state variable to hold API response
  const cameraRef = useRef(null);

  const BASE_URL = 'https://b646-103-19-109-57.ngrok-free.app';   // API URL

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      console.log("Camera permission status:", status);
      if (status !== 'granted') {
        setIsCameraVisible(false);
        Alert.alert("Permission Required", "Camera access is needed.");
      }
    })();
  }, []);

  const captureImage = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        console.log("Captured photo:", photo);

        // Resize the image and compress it further to make the file smaller
        const resizedPhoto = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 224, height: 224 } }],  // Aggressive resize to 160x160
          { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }  // Strong compression (reduce file size)
        );

        console.log("Resized and compressed photo URI:", resizedPhoto.uri);
        setImageUri(resizedPhoto.uri);
        setResponseData(null);  // Clear previous result

        await recognizeFood(resizedPhoto.uri);
        setIsCameraVisible(false);
      } catch (error) {
        console.error("Error capturing image: ", error);
        Alert.alert("Error", "An error occurred while capturing the image.");
      }
    } else {
      Alert.alert("Camera Error", "Camera is not available.");
    }
  };

  const recognizeFood = async (uri) => {
    setLoading(true);
    const apiUrl = `${BASE_URL}/api/capture`;
    console.log('API URL:', apiUrl);  // Log the API URL for debugging

    try {
      const base64Image = await convertImageToBase64(uri);
      console.log("Base64 Image Ready:", base64Image ? base64Image.substring(0, 50) : "No image data");  // Log first 50 characters of base64

      console.log("Sending image to API...");
      const response = await axios.post(apiUrl, 
        { image: base64Image },
        { 
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': true, // Add ngrok specific header
            'Accept': 'application/json'
          },
          validateStatus: null // Accept all status codes to see what's happening
        }
      );
      console.log("API Response:", response.status, response.data);
      
      if (response.data && response.data.food_name && response.data.nutrition_info) {
        setResponseData(response.data);  
       
        Alert.alert(
          "API Response",
          `Food: ${response.data.food_name}\nNutrients: ${JSON.stringify(response.data.nutrition_info)}`,
          [{ text: 'OK' }]
        );
      } else {
        console.log("No valid data received from API.");
        if (!response.data) {
          console.log("No data in response.");
        } else if (!response.data.food_name) {
          console.log("Food name missing in response.");
        } else if (!response.data.nutrition_info) {
          console.log("Nutrition info missing in response.");
        }
        Alert.alert("Error", "Food not recognized or nutrition data unavailable. Please try again.");
        setResponseData(null); 
      }
    } catch (error) {
      console.error("Error in recognizeFood:", error);
      Alert.alert("Error", "Failed to recognize food. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  

  const convertImageToBase64 = async (uri) => {
    try {
      console.log("Starting image conversion to Base64...");

      // Resize the image to 160x160 and compress it to reduce file size
      // const resizedImage = await ImageManipulator.manipulateAsync(
      //   uri,
      //   [{ resize: { width: 160, height: 160 } }],  // Resize to a smaller size
      //   { compress: 0.2, format: ImageManipulator.SaveFormat.JPEG }  // Strong compression
      // );

      // Convert the resized and compressed image to Base64
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      console.log("Base64 conversion complete, length:", base64.length);
      return base64;
    } catch (error) {
      console.log("Error converting image to Base64", error);
      throw new Error("Failed to convert image to Base64");
    }
  };

  if (hasPermission === null) {
    return <View />;  // Waiting for permission
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;  // No camera access
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>NutraScan</Text>
  
      {/* Camera section */}
      {isCameraVisible && hasPermission && (
        <Camera ref={cameraRef} style={styles.camera} type={CameraType.back}>
          <View style={styles.captureButtonContainer}>
            <Button title="Capture" onPress={captureImage} color="#28a745" />
          </View>
        </Camera>
      )}
  
      <Button
        title={isCameraVisible ? "Close Camera" : "Open Camera"}
        onPress={() => setIsCameraVisible(!isCameraVisible)}
        color="#007bff"
      />
  
      {/* Loading Spinner */}
      {loading && !imageUri && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" style={styles.loading} />
          <Text style={styles.loadingText}>Processing your image...</Text>
        </View>
      )}
  
      {/* Display captured image */}
      {imageUri && (
        <>
          <Text style={styles.nutritionTitle}>The Image:</Text>
          <Image source={{ uri: imageUri }} style={styles.image} />
        </>
      )}
  
      {/* Display API response data */}
      {responseData && (
        <View style={styles.nutritionContainer}>
          <Text style={styles.nutritionTitle}>Predicted Food:</Text>
          <Text style={styles.foodName}>{responseData.food_name}</Text>
  
          <Text style={styles.nutritionTitle}>Nutritional Information:</Text>
          {responseData.nutrition_info && responseData.nutrition_info.map((nutrient, index) => (
            <Text key={index} style={styles.nutritionText}>
              {nutrient.name}: {nutrient.value}
            </Text>
          ))}
        </View>
      )}
  
      {/* Error message */}
      {(!responseData && !loading) && (
        <Text style={styles.errorText}>Food not recognized or nutrition data unavailable. Please try again.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f2f2f2',
  },
  camera: {
    width: 300,
    height: 300,
    marginBottom: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  captureButtonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  image: {
    width: 300,
    height: 300,
    marginTop: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  nutritionContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '100%',
    alignItems: 'flex-start',
  },
  nutritionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  foodName: {
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  nutritionText: {
    fontSize: 14,
    marginBottom: 3,
  },
  errorText: {
    fontSize: 14,
    color: '#ff0000',
    marginTop: 20,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
  },
});

export default App;

import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { AppState, Platform, StyleSheet, Text, View } from "react-native";
import AppleHealthKit, {
  HealthValue,
  HealthKitPermissions,
} from "react-native-health";
import GoogleFit, {
  BucketUnit,
  Scopes,
  StepsResponse,
} from "react-native-google-fit";
import { Pedometer } from "expo-sensors";

export default function App() {
  const appState = useRef(AppState.currentState);

  const [iosStepCount, setIosStepCount] = useState<number>(0);
  const [aosStepCount, setAosStepCount] = useState<number>(0);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);

  const [isPedometerAvailable, setIsPedometerAvailable] = useState("checking");
  const [pastStepCount, setPastStepCount] = useState(0);
  const [currentStepCount, setCurrentStepCount] = useState(0);

  const date = new Date();

  const subscribe = async () => {
    if (isPedometerAvailable) {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 1);
      console.log("third", end, start);

      const pastStepCountResult = await Pedometer.getStepCountAsync(start, end);
      console.error(">>>>first", pastStepCountResult);
      if (pastStepCountResult) {
        console.error(">>>>", pastStepCountResult);
        setPastStepCount(pastStepCountResult.steps);
      }

      Pedometer.watchStepCount((result) => {
        console.log("fourth", result);
        setCurrentStepCount(result.steps);
      });
    }
  };

  if (Platform.OS === "ios") {
    const iosPermissions = {
      permissions: {
        read: [AppleHealthKit.Constants.Permissions.StepCount],
      },
    } as HealthKitPermissions;

    AppleHealthKit.initHealthKit(iosPermissions, (error: string) => {
      AppleHealthKit.getStepCount(
        iosOptions,
        (callbackError: string, results: HealthValue) => {
          console.log(">>> setCount");
          setIosStepCount(results?.value ? results.value : 0);
        }
      );

      if (error) {
        console.log("[ERROR] Cannot grant permissions!");
      }
    });
  }

  if (Platform.OS === "android") {
    // GoogleFit.checkIsAuthorized().then(() => {
    //   console.log("GoogleFit Authorized: ", GoogleFit.isAuthorized); // Then you can simply refer to `GoogleFit.isAuthorized` boolean.
    //   const aosPermissions = {
    //     scopes: [
    //       Scopes.FITNESS_ACTIVITY_READ,
    //       Scopes.FITNESS_ACTIVITY_WRITE,
    //       Scopes.FITNESS_BODY_READ,
    //       Scopes.FITNESS_BODY_WRITE,
    //     ],
    //   };
    //   GoogleFit.authorize(aosPermissions)
    //     .then((authResult) => {
    //       if (authResult.success) {
    //         console.log("authorized >>>", authResult);
    //         GoogleFit.getDailySteps(date)
    //           .then((res) => {
    //             console.log("Daily steps >>> ", res[2].steps);
    //             setAosStepCount(res[2].steps[res[2].steps.length - 1].value);
    //           })
    //           .catch((err) => {
    //             console.warn("ERROR >>>", err);
    //           });
    //       } else {
    //         console.log("denied >>>", authResult);
    //       }
    //     })
    //     .catch((err) => {
    //       console.log("err >>>", err);
    //     });
    // });
    Pedometer.getPermissionsAsync().then((res) => {
      console.log("first", res);
    });
    Pedometer.isAvailableAsync().then(
      (res) => {
        console.log("second", res);
        setIsPedometerAvailable(String(res));
        subscribe();
      },
      (error) => {
        setIsPedometerAvailable(error);
      }
    );
  }

  if (Platform.OS === "ios") {
    useEffect(() => {
      const subscription = AppState.addEventListener(
        "change",
        (nextAppState) => {
          if (
            appState.current.match(/inactive|background/) &&
            nextAppState === "active"
          ) {
            console.log("App has come to the foreground!");
            AppleHealthKit.getStepCount(
              iosOptions,
              (callbackError: string, results: HealthValue) => {
                console.log(">>> setCount");
                setIosStepCount(results?.value ? results.value : 0);
              }
            );
          }

          appState.current = nextAppState;
          setAppStateVisible(appState.current);
          console.log("AppState", appState.current);
        }
      );

      return () => {
        subscription.remove();
      };
    }, []);
  }

  /* Can now read or write to HealthKit */
  const iosOptions = {
    startDate: date.toISOString(),
  };

  const aosOptions = {
    startDate: date.toISOString(), // required ISO8601Timestamp
    // bucketUnit: BucketUnit.DAY, // optional - default "DAY". Valid values: "NANOSECOND" | "MICROSECOND" | "MILLISECOND" | "SECOND" | "MINUTE" | "HOUR" | "DAY"
    // bucketInterval: 1, // optional - default 1.
  };

  return (
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!</Text>
      <Text>Current state is: {appStateVisible}</Text>
      {Platform.OS === "ios" ? (
        <Text>StepCountApple : {iosStepCount}</Text>
      ) : (
        // : <Text>StepCountAndroid : {aosStepCount}</Text>}
        <>
          <Text>StepCountAndroid : {currentStepCount}</Text>
          <Text>isPedometerAvailable: {isPedometerAvailable}</Text>
        </>
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});

// const test = [
//   {
//     "rawSteps": [],
//     "source": "com.google.android.gms:merge_step_deltas",
//     "steps": []
//   },
//   {
//     "rawSteps": [],
//     "source": "com.xiaomi.hm.health",
//     "steps": []
//   },
//   {
//     "rawSteps": [[Object]],
//     "source": "com.google.android.gms:estimated_steps",
//     "steps": [[Object]]
//   }
// ]

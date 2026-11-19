//==========================================================================================

function findByAddress(obj, address) {
    if (obj.address === address) return obj;
    if (Array.isArray(obj)) {
        for (const el of obj) {
            const found = findByAddress(el, address);
            if (found) return found;
        }
    } else if (obj && typeof obj === 'object') {
        for (const key in obj) {
            const found = findByAddress(obj[key], address);
            if (found) return found;
        }
    }
    return null;
}

//==========================================================================================

function getParamMinMax(param) {
    const minValue = param?.min;
    const maxValue = param?.max;
    return [minValue, maxValue]
}

//==========================================================================================

function setMotionListeners() {
  // iOS 13+ requires permission request from user gesture.
  // Motion (acceleration) and orientation (rotation) are two separate permissions.
  [window.DeviceMotionEvent, window.DeviceOrientationEvent].forEach((Evt) => {
    if (!Evt || typeof Evt.requestPermission !== 'function') return;
    Evt.requestPermission()
      .then(permissionState => {
        console.log("Sensor permission:", permissionState);
        if (permissionState !== 'granted') {
          alert('Motion sensors permission denied. Please enable in Settings > Safari > Motion & Orientation Access');
        }
      })
      .catch((error) => {
        // Called without a user gesture (e.g. from setup()): the button click will ask again.
        console.log("Error getting sensor permission: %O", error);
      });
  });
}

//==========================================================================================

const audioContext = new AudioContext();
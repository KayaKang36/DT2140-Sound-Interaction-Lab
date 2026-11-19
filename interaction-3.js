//==========================================================================================
// AUDIO SETUP
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit just where you're asked to!
//------------------------------------------------------------------------------------------
//
//==========================================================================================
let dspNode = null;
let dspNodeParams = null;
let jsonParams = null;

// Change here to ("tuono") depending on your wasm file name
const dspName = "rain";
const instance = new FaustWasm2ScriptProcessor(dspName);

// output to window or npm package module
if (typeof module === "undefined") {
    window[dspName] = instance;
} else {
    const exp = {};
    exp[dspName] = instance;
    module.exports = exp;
}

// 如果 Console 里打印的地址和这里不一样，改这两行
const DENSITY_ADDR = "/rain/density";
const VOLUME_ADDR = "/rain/volume";

// The name should be the same as the WASM file, so change tuono with brass if you use brass.wasm
rain.createDSP(audioContext, 1024)
    .then(node => {
        dspNode = node;
        dspNode.connect(audioContext.destination);
        console.log('params: ', dspNode.getParams());
        const jsonString = dspNode.getJSON();
        jsonParams = JSON.parse(jsonString)["ui"][0]["items"];
        dspNodeParams = jsonParams
        // const exampleMinMaxParam = findByAddress(dspNodeParams, "/thunder/rumble");
        // // ALWAYS PAY ATTENTION TO MIN AND MAX, ELSE YOU MAY GET REALLY HIGH VOLUMES FROM YOUR SPEAKERS
        // const [exampleMinValue, exampleMaxValue] = getParamMinMax(exampleMinMaxParam);
        // console.log('Min value:', exampleMinValue, 'Max value:', exampleMaxValue);
    });


//==========================================================================================
// INTERACTIONS
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit the next functions to create interactions
// Decide which parameters you're using and then use playAudio to play the Audio
//------------------------------------------------------------------------------------------
// p5 1.9 的 rotationY 是左右倾斜角，单位是度，范围 -90° 到 90°
const DEAD_ZONE_DEG = 5;    // 倾斜小于 5° 视为放平，不下雨
const MAX_TILT_DEG = 60;    // 倾斜到 60° 时雨最大
const SMOOTHING = 0.1;      // 0–1，越小变化越平滑

let rainLevel = 0;          // 平滑后的雨量，0–1
let densityRange = null;


//==========================================================================================

function accelerationChange(accx, accy, accz) {
    // playAudio()
}


function rotationChange(rotx, roty, rotz) {
    // 电脑上没有方向传感器，三个值一直是 0：跳过，保留鼠标调试的效果
    if (rotx === 0 && roty === 0 && rotz === 0) return;

    // 向左或向右倾斜都算，取绝对值
    const tilt = Math.min(Math.abs(roty), MAX_TILT_DEG);
    const target = tilt < DEAD_ZONE_DEG ? 0 : (tilt - DEAD_ZONE_DEG) / (MAX_TILT_DEG - DEAD_ZONE_DEG);

    rainLevel += (target - rainLevel) * SMOOTHING;
    playAudio(rainLevel);
}




function mousePressed() {
    playAudio(mouseX/windowWidth)
    // Use this for debugging from the desktop!
}

function deviceMoved() {
    movetimer = millis();
    statusLabels[2].style("color", "pink");
}

function deviceTurned() {
    threshVals[1] = turnAxis;
}
function deviceShaken() {
    shaketimer = millis();
    statusLabels[0].style("color", "pink");
    playAudio();
}

function getMinMaxParam(address) {
    const exampleMinMaxParam = findByAddress(dspNodeParams, address);
    // ALWAYS PAY ATTENTION TO MIN AND MAX, ELSE YOU MAY GET REALLY HIGH VOLUMES FROM YOUR SPEAKERS
    const [exampleMinValue, exampleMaxValue] = getParamMinMax(exampleMinMaxParam);
    console.log('Min value:', exampleMinValue, 'Max value:', exampleMaxValue);
    return [exampleMinValue, exampleMaxValue]
}

//==========================================================================================
// AUDIO INTERACTION
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit here to define your audio controls 
//------------------------------------------------------------------------------------------
//
//==========================================================================================

// level：0 = 没有雨，1 = 最大的雨
function playAudio(level) {
    if (!dspNode) {
        return;
    }
    if (audioContext.state === 'suspended') {
        return;
    }

    if (densityRange === null) {
        densityRange = getMinMaxParam(DENSITY_ADDR);   // 只查一次，避免每帧刷屏
    }

    const [minD, maxD] = densityRange;

    if (minD === undefined) {
        console.warn("找不到参数 " + DENSITY_ADDR + "，请对照 Console 里 params 的地址修改");
        return;
    }
    level = Math.min(Math.max(level, 0), 1);
    console.log(level)
    dspNode.setParamValue(DENSITY_ADDR, minD + level * (maxD - minD));
    dspNode.setParamValue(VOLUME_ADDR, level);
}


//==========================================================================================
// END
//==========================================================================================
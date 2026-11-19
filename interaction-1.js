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
const dspName = "tuono";
const instance = new FaustWasm2ScriptProcessor(dspName);

// output to window or npm package module
if (typeof module === "undefined") {
    window[dspName] = instance;
} else {
    const exp = {};
    exp[dspName] = instance;
    module.exports = exp;
}

// The name should be the same as the WASM file, so change tuono with brass if you use brass.wasm
tuono.createDSP(audioContext, 1024)
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

// 自由下落检测：静止时加速度（含重力）的大小约 9.8 m/s²，自由下落时接近 0。
// 下落 30 cm 大约需要 sqrt(2 * 0.3 / 9.81) ≈ 0.25 s，所以要求持续 200 ms 以上。
const FREEFALL_THRESHOLD = 3.0;   // m/s²，低于它就认为在自由下落
const FREEFALL_MIN_MS = 200;      // 至少持续这么久才算（过滤掉短暂抖动）
const COOLDOWN_MS = 2000;         // 两次雷声之间至少间隔 2 秒

let fallStart = null;   // 本次低加速度开始的时刻（millis），null = 当前没有在下落
let lastThunder = -COOLDOWN_MS; // 上次播放雷声的时刻，初值保证第一次下落就能触发
//==========================================================================================

/*
使用前先在手机上验证一件事：手机静止平放时，页面上的 Acceleration Z 是多少。
约 9.8（或 19.6）：说明 p5 的数值含重力，这个版本能用。
接近 0：说明 p5 给的是去掉重力的数值，自由下落和静止时差不多都是 0，分辨不出来。*/

// p5 在 sketch.js 的 draw() 中每一帧调用这个函数，传入 accelerationX/Y/Z
function accelerationChange(accx, accy, accz) {
    if (!accx && !accy && !accz) return; // 电脑上没有传感器，数值全为 0，直接跳过

    const mag = Math.sqrt(accx * accx + accy * accy + accz * accz);
    const now = millis();

    if (mag < FREEFALL_THRESHOLD) {
        if (fallStart === null) fallStart = now;
        if (now - fallStart > FREEFALL_MIN_MS && now - lastThunder > COOLDOWN_MS) {
            lastThunder = now;
            console.log("Free fall detected, magnitude =", mag.toFixed(2));
            playAudio();
        }
    } else {
        fallStart = null;
    }
}
function rotationChange(rotx, roty, rotz) {
}

function mousePressed() {
    playAudio()
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

function playAudio() {
    if (!dspNode) {
        return;
    }
    if (audioContext.state === 'suspended') {
        return;
    }
    // Edit here the addresses ("/thunder/rumble") depending on your WASM controls (you can see 
    // them printed on the console of your browser when you load the page)
    // For example if you change to a bell sound, here you could use "/churchBell/gate" instead of
    // "/thunder/rumble".
    dspNode.setParamValue("/thunder/rumble", 1)
    setTimeout(() => { dspNode.setParamValue("/thunder/rumble", 0) }, 100);
}

//==========================================================================================
// END
//==========================================================================================
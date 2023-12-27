function show() {
  //try to go for fullscreen
  const elem = document.documentElement;
  if (elem.requestFullscreen) { /* Chrome */
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) { /* Safari */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) { /* IE11 */
    elem.msRequestFullscreen();
  }

  document.querySelector("#gameScreen").style.display = "block";

  init('joystick1');
  init('joystick2');

}

function init(joystickName) {

  var xCenter = 150;
  var yCenter = 150;
  var stage = new createjs.Stage(joystickName);

  var psp = new createjs.Shape();
  psp.graphics.beginFill('#333333').drawCircle(xCenter, yCenter, 50);
  psp.alpha = 0.25;

  stage.addChild(psp);
  createjs.Ticker.framerate = 1000 / 15;
  createjs.Ticker.addEventListener('tick', stage);
  stage.update();

  var myElement = $('#' + joystickName)[0];
  var hammer = new Hammer(myElement);

  hammer.on("panstart", function (ev) {
    xCenter = psp.x;
    yCenter = psp.y;
    psp.alpha = 0.25;
    switch (joystickName) {
      case "joystick1":
        joystickData.shoot.moving = true;
        break;
      case "joystick2":
        joystickData.movement.moving = true;
    }

    stage.update();
  });

  hammer.on("panmove", function (ev) {
    var coords = calculateCoords(ev.angle, ev.distance);
    switch (joystickName) {
      case "joystick1":
        joystickData.shoot.angle = ev.angle;
        break;
      case "joystick2":
        joystickData.movement.angle = ev.angle;
    }
    psp.x = coords.x;
    psp.y = coords.y;
    psp.alpha = 0.5;
    stage.update();
  });

  hammer.on("panend", function (ev) {
    psp.alpha = 0.25;
    switch (joystickName) {
      case "joystick1":
        joystickData.shoot.moving = false;
        break;
      case "joystick2":
        joystickData.movement.moving = false;
    }
    createjs.Tween.get(psp).to({ x: xCenter, y: yCenter }, 750, createjs.Ease.elasticOut);
  });

  $('#' + joystickName).css("background-color", 'white');
}

function calculateCoords(angle, distance) {
  var coords = {};
  distance = Math.min(distance, 150);
  var rads = (angle * Math.PI) / 180.0;

  coords.x = distance * Math.cos(rads);
  coords.y = distance * Math.sin(rads);

  return coords;
}


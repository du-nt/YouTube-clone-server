const secondsToHms = (seconds) => {
  var h = Math.floor(seconds / 3600);
  var m = Math.floor((seconds % 3600) / 60);
  var s = Math.floor((seconds % 3600) % 60);

  var hDisplay = h > 0 ? `${h}:` : "";
  var mDisplay = `${m}:`;
  var sDisplay = `${s}`;
  return hDisplay + mDisplay + sDisplay;
};

module.exports = {
  secondsToHms,
};

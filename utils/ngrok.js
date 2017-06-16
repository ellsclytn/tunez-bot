const ngrok = require('ngrok');

ngrok.connect(3000, (err, url) => {
  if (err) throw new Error(err);
  console.log(`ngrok tunnelling with url: ${url}`);
});

const fs = require('fs');

function updateJson(filePath, updater) {
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);
  updater(data);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`Updated ${filePath}`);
}

// Update FR
updateJson('messages/fr/app.json', (data) => {
  data.dashboard.quick.textile = {
    title: "Atelier textile",
    body: "Maillots, t-shirts, DTF & flex"
  };
});

// Update EN
updateJson('messages/en/app.json', (data) => {
  data.dashboard.quick.textile = {
    title: "Textile Studio",
    body: "Jerseys, tees, DTF & heat transfer"
  };
});

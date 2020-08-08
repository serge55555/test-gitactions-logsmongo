require("dotenv").config();
const monk = require("monk"),
  { performance } = require("perf_hooks");

// Connection URL
const url = process.env.MONGO_URL;

// Over env variables
const isGitAction = process.env.GITHUB_ACTIONS,
  gitActor = process.env.GITHUB_ACTOR,
  timeRan = process.env.GITHUB_RUN_NUMBER,
  workflowName = process.env.GITHUB_WORKFLOW,
  isLocaTest = process.env.LOCAL_DEV;

// Start timer
const timerStart = performance.now();
var timeTaken;

// Connect to DB
const db = monk(url);

db.then(() => {
  console.log("Connected correctly to server");
}).catch((err) => console.error(err.message || err));

// Construct document
const date = new Date().toGMTString();
const issuer = () => {
  if (isGitAction) {
    return `Triggered by ${gitActor}.
        This is the ${timeRan}th time the ${workflowName} has been run!`;
  } else if (isLocaTest) {
    return "Triggered from dev environment.";
  } else {
    return "Trigered somewhere...";
  }
};

// Access logs collection
const collection = db.get("github_logs");

// And insert the new document
collection
  .insert({
    date: date,
    issuer: issuer(),
  })
  .then((doc) => {
    timeTaken = performance.now() - timerStart;
    console.log(`Finished successfully in ${timeTaken} ms.`);
    console.log(doc);
  })
  // Update the document to insert time taken to create the document.
  .then(() => {
    collection.update({ date: date }, { $set: { time: `${timeTaken} ms` } });
  })
  .catch((err) => {
    console.error(err);
  })
  .finally(() => db.close());

const fs = require("fs");
const { parse } = require("csv-parse");

const read_csv = (filename) => {
  console.log(filename)
  return new Promise((resolve, reject) => {
    const index = {}; // Record<string, number>
    const rows = [];

    let isHeaderRead = false;

    const processStream = (row) => {
      if (!isHeaderRead) {
        row.forEach((col, i) => (index[col] = i));
        isHeaderRead = true;
      } else {
        rows.push(row);
      }
    };

    fs.createReadStream(filename)
      .pipe(parse({ delimiter: "," }))
      .on("data", processStream)
      .on("end", () => resolve({ rows, index }))
      .on("error", reject);
  });
};

const compare = (a, b) => {
    if(a > b) return 1;
    if(a < b) return -1;
    return 0
};

const round = (num) => {
  return parseFloat(num).toLocaleString('en-US', {
     minimumFractionDigits: 2,
     maximumFractionDigits: 2,
     roundingMode: "trunc"
  });
}

async function analysis(filename) {
  // headers: date, titleSlug, questionFrontendId, title, difficulty, acRate
  const {rows, index: i} = await read_csv(filename);

  let counts = {};
  let rates = [["date", "acRate"]];
  let last_appearance = {};
  let questions = {};
  let min_occurences = {}; // minimum time to reoccur for each question
  let recur_times = [];
  let diff_counts = {}
  for (let diff of ["Easy", "Medium", "Hard"]) {
    diff_counts[diff] = {
        "count": 0,
        "day": [0, 0, 0, 0, 0, 0, 0]
    }
  }

  for (let row of rows) {
    let d = row[i["date"]].split('-');
    let date = Date.UTC(d[0], d[1] - 1, d[2]);
    // let slug = row[i["titleSlug"]];
    let id = row[i["questionFrontendId"]];
    let title = row[i["title"]];
    let difficulty = row[i["difficulty"]];
    let acRate = row[i["acRate"]];

    rates.push([new Date(date).getUTCDate(), acRate]);

    diff_counts[difficulty]["count"] += 1;
    diff_counts[difficulty]["day"][new Date(date).getUTCDay()] += 1;

    questions[id] = `${id}. ${title} (${difficulty})`;
    if (id in last_appearance) {
      if (!(id in min_occurences) || date - last_appearance[id] < min_occurences[id][0]) {
        min_occurences[id] = [date - last_appearance[id], last_appearance[id], date];
      }
      recur_times.push(date - last_appearance[id]);
    }
    counts[id] = (id in counts) ? counts[id] + 1 : 1;
    last_appearance[id] = date;
  }

  let count_of_counts = {};
  for (let q of Object.keys(counts)) {
    let c = counts[q];
    count_of_counts[c] = (c in count_of_counts) ? count_of_counts[c] + 1 : 1;
  }

  console.log("\nGeneral Stats\n=======");
  console.log(`Total dailies: ${rows.length}`);
  console.log(`Unique questions: ${Object.keys(questions).length}`);
  console.log(`Number of questions that reoccurred: ${Object.keys(min_occurences).length}`);
  console.log(`Avg. Recur Time: ${round(recur_times.reduce((partialSum, a) => partialSum + a, 0) / (recur_times.length * 60 * 60 * 1000 * 24))} Days`);

  console.log("\nDifficulty Count\n=======");
  for (let diff of Object.keys(diff_counts)) {
    console.log(`${diff.padEnd(7)}: ${diff_counts[diff]["count"]} (${round(100 * diff_counts[diff]["count"] / rows.length)}%)`);
  }

  console.log("\nDifficulty Day Frequency\n=======");
  for (let diff of Object.keys(diff_counts)) {
    console.log(`${diff.padEnd(7)}: ${diff_counts[diff]["day"].map((x) => round(100 * x / diff_counts[diff]["count"]).padEnd(7))}`);
  }

  console.log("\nQuestion Frequency\n=======");
  for (let c of Object.entries(count_of_counts)) {
    console.log(`${c[0]} Appearance${(c[0] > 1) ? "s" : " "} : ${c[1]} Questions`);
  }

  console.log("\nMinimum time since occurence\n=======");
  for (let q of Object.entries(min_occurences).sort((a, b) => compare(a[1][0], b[1][0])).slice(0, 5)) {
    console.log(questions[q[0]]);
    console.log(`${q[1][0] / (1000 * 60 * 60 * 24)} days : ${new Date(q[1][1]).toUTCString().slice(0, 16)} - ${new Date(q[1][2]).toUTCString().slice(0, 16)}\n`);
  }

  // save recur times for histogram
  //fs.writeFileSync("recur.csv", recur_times.map((x) => x / (60 * 60 * 1000 * 24)).join(","), 'utf8');
  // save acRate vs date
  //fs.writeFileSync("acRate.csv", rates.map(row => row.join(",")).join("\n"), 'utf8');
}

analysis("./daily.csv")

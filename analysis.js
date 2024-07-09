const fs = require("fs");
const { parse } = require("csv-parse");

global.rows = [];
global.index = {};

fs.createReadStream("./daily.csv")
  .pipe(parse({ delimiter: ",", to_line: 1 }))
  .on("data", set_headers)
  .on("end", () => fs.createReadStream("./daily.csv")
    .pipe(parse({ delimiter: ",", from_line: 2 }))
    .on("data", read_row)
    .on("end", analysis)
  );

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

function analysis() {
  // headers: date, titleSlug, questionFrontendId, title, difficulty
  let rows = global.rows;
  let i = global.index;

  let counts = {};
  let last_appearance = {};
  let questions = {};
  let min_time = Infinity;
  let min_question = -1;
  let min_occurences = {};
  let diff_counts = {
    "Easy": {
        "count": 0,
        "day": [0, 0, 0, 0, 0, 0, 0]
    },
    "Medium": {
        "count": 0,
        "day": [0, 0, 0, 0, 0, 0, 0]
    },
    "Hard": {
        "count": 0,
        "day": [0, 0, 0, 0, 0, 0, 0]
    }
  }
  for (let row of rows) {
    let d = row[i["date"]].split('-');
    let date = Date.UTC(d[0], d[1] - 1, d[2]);
    let slug = row[i["titleSlug"]];
    let id = row[i["questionFrontendId"]];
    let title = row[i["title"]];
    let difficulty = row[i["difficulty"]];

    diff_counts[difficulty]["count"] += 1;
    diff_counts[difficulty]["day"][new Date(date).getUTCDay()] += 1;

    questions[id] = `${id}. ${title} (${difficulty})`;
    if (id in last_appearance) {
      if (!(id in min_occurences) || date - last_appearance[id] < min_occurences[id][0]) {
        min_occurences[id] = [date - last_appearance[id], last_appearance[id], date];
      }
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
}

function set_headers(row) {
  for (let i in row) {
    global.index[row[i]] = i;
  }
}

function read_row(row) {
  global.rows.push(row);
}

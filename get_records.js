const fs = require("fs");

const end_year = 2024;
const end_month = 7;

let headings = ["date", "titleSlug", "questionFrontendId", "title", "difficulty", "acRate"];
(async () => {
  let daily = [];
  let weekly = [];
  daily.push(headings);
  weekly.push(headings);
  // first daily: 2020-04 (first weekly: 2020-08)
  for (let year = 2020; year <= end_year; year++) {
    for (let month = 1; month <= 12; month++) {
      if ((year == 2020 && month < 4) || (year == end_year && month > end_month)) {
        continue;
      }

      console.log(`fetching: ${year}-${month}`);
      let res = await get_records(year, month);

      append_to_arr(res["challenges"], daily);
      append_to_arr(res["weeklyChallenges"], weekly);

      await sleep(2000); // to prevent rate limiting
    }
  }

  save_file(daily, "daily");
  save_file(weekly, "weekly");

  console.log("finished writing");
})();

function append_to_arr(input, arr) {
  for (let day of input) {
    let q = day["question"];
    q["date"] = day["date"];
    q["acRate"] = JSON.parse(q["stats"])["acRate"].replace("%", "");
    let row = [];
    for (let h of headings) {
      row.push(q[h]);
    }
    arr.push(row);
  }
}

function save_file(arr, filename) {
  let csv = array_to_csv(arr);
  fs.writeFileSync(filename + ".csv", csv, 'utf8')
}

function array_to_csv(arr) {
  return arr.map(row => row.map(s => (
    String(s).match(/,|"/) ? `"${s.replace(/"/g,'""')}"` : s
  )).join`,`).join`\n`;
}

async function get_records(year, month) {
  let url = `https://leetcode.com/graphql/?query=query{
  dailyCodingChallengeV2(year: ${year}, month: ${month}) {
    challenges {
      date
      question {
        questionFrontendId
        title
        titleSlug
        difficulty
        stats
      }
    }
    weeklyChallenges {
      date
      question {
        questionFrontendId
        title
        titleSlug
        difficulty
        stats
      }
    }
  }
}`;
  let response = await fetch(url);
  let json = await response.json();
  return json["data"]["dailyCodingChallengeV2"];
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

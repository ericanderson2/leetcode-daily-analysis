# leetcode-daily-analysis

LeetCode has a 'daily' question that changes at 0:00 UTC every day. This code fetches and analyzes every daily from 2020-04-01 (the first date available in the API) to present.

## Running

`get_records.js` fetches the information about the daily and weekly questions from the LeetCode API, and writes them to CSV files. Those files have already been generated and are included in this repository (up-to-date as of 2024-07-09). For the most updated data, use `node get_records.js` in your console. Also, make sure to update the `end_year` (current year) and `end_month` (current month, 1-12) values, which are hardcoded in the file. This will take a minute or two -- to prevent rate limiting, the code waits for 2 seconds after pulling the data for each month.

To run the analysis, use `node analysis.js` in the console. This code will read a CSV file and output summary statistics in the console. It only summarizes statistics for `daily.csv`, but you can modify the code to show the weekly statistics.

## Visualizations

Some charts I made with the results of the analysis.

### The distribution of different difficulties over the week
![day frequency](https://github.com/ericanderson2/leetcode-daily-analysis/blob/main/visualizations/day_frequency.png)

### Number of appearances
22 questions appeared 4 times. Out of 1561 total days, there were 945 unique questions.
![question frequency](https://github.com/ericanderson2/leetcode-daily-analysis/blob/main/visualizations/Question%20Frequency.png)

### Comparing daily and overall distribution
![daily and overall comparison](https://github.com/ericanderson2/leetcode-daily-analysis/blob/main/visualizations/question_distribution.png)

### Time between question appearances

Average time between reoccurrences: 531 days.

![time to reoccur](https://github.com/ericanderson2/leetcode-daily-analysis/blob/main/visualizations/Time%20for%20question%20to%20reoccur.png)

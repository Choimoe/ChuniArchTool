import csv
import json

FULL_CHAIN_MAP = {
    0: "",
    1: "fullchain",
    2: "fullchain2",
    3: "fullchain3",
    4: "fullchain4",
}
REV_RANK_MAP = {
    0: "d",
    1: "c",
    2: "b",
    3: "bb",
    4: "bbb",
    5: "a",
    6: "aa",
    7: "aaa",
    8: "s",
    9: "sp",
    10: "ss",
    11: "ssp",
    12: "sss",
    13: "sssp",
}


def convert_to_csv(json_data):
    csv_rows = []

    for log in json_data["userPlaylogList"]:
        A = log["judgeGuilty"]
        B = log["judgeAttack"]
        C = log["judgeJustice"]
        total = A + B + C
        if total < 10:
            clear = "catastrophe"
        elif total < 50:
            clear = "absolute"
        elif total < 150:
            clear = "brave"
        elif total < 300 or A < 20:
            clear = "hard"
        elif log["isClear"]:
            clear = "clear"
        else:
            clear = "failed"

        if log["score"] == 1010000:
            full_combo = "alljusticecritical"
        elif log["isAllJustice"]:
            full_combo = "alljustice"
        elif log["isFullCombo"]:
            full_combo = "fullcombo"
        else:
            full_combo = ""

        full_chain = FULL_CHAIN_MAP.get(log["fullChainKind"], "")

        rank_str = REV_RANK_MAP.get(log["rank"], "")

        upload_time = log["userPlayDate"].replace("T", " ")
        play_time = log["playDate"].replace("T", " ")

        row = [
            str(log["musicId"]),
            "",
            str(log["level"]),
            str(log["level"]),
            str(log["score"]),
            "0",
            "0",
            clear,
            full_combo,
            full_chain,
            rank_str,
            upload_time,
            play_time,
        ]
        csv_rows.append(row)

    return csv_rows


if __name__ == "__main__":
    with open("input.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    csv_data = convert_to_csv(data)

    with open("output.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(
            [
                "id",
                "song_name",
                "level",
                "level_index",
                "score",
                "rating",
                "over_power",
                "clear",
                "full_combo",
                "full_chain",
                "rank",
                "upload_time",
                "play_time",
            ]
        )
        writer.writerows(csv_data)

    print("转换完成！CSV已保存至 output.csv")

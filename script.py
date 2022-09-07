

# Copyright 2012-2019 Gerwin Sturm
#
# Thanks to all contributors:
# https://github.com/Scarygami/location-history-json-converter/graphs/contributors
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from __future__ import division

import sys
import json
import dateutil.parser

print('Starting...')

def _write_header(output):
    output.write("{\"locations\":[")
    return

def _write_location(output, location, first):

    if not first:
        output.write(",")
    time = location["timestamp"]
    parsed_time = dateutil.parser.parse(time)
    timestamp = parsed_time.timestamp() * 1000
    temp = str(int(timestamp))
    item = {
        "timestampMs": temp,
        "latitudeE7": location["latitudeE7"],
        "longitudeE7": location["longitudeE7"],
        "Accuracy": location["accuracy"]
    }
    output.write(json.dumps(item, separators=(',', ':')))
    return

def _write_footer(output):
    output.write("]}")    
    return

def convert(locations, output):

    _write_header(output)

    first = True
    added = 0
    print("Progress:")
    for item in locations:
        if "longitudeE7" not in item or "latitudeE7" not in item or "timestamp" not in item:
            continue
        
        print("\rLocations written: %s" % (added), end="")

        if "accuracy" not in item:
            continue

        # Fix overflows in Google Takeout data:
        # https://gis.stackexchange.com/questions/318918/latitude-and-longitude-values-in-google-takeout-location-history-data-sometimes
        if item["latitudeE7"] > 1800000000:
            item["latitudeE7"] = item["latitudeE7"] - 4294967296
        if item["longitudeE7"] > 1800000000:
            item["longitudeE7"] = item["longitudeE7"] - 4294967296

        _write_location(output, item, first)

        if first:
            first = False
        added = added + 1

    _write_footer(output)
    print("")

def main():

    with open("Records.json", "r") as f:
        json_data = f.read()

    data = json.loads(json_data)
    items = data["locations"]

    f_out = open("locationhistory.json", "w")

    convert(
        items, f_out
    )
    f_out.close()

if __name__ == "__main__":
    sys.exit(main())
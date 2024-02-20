import fetch from "node-fetch";

// Replace with your actual data
const apiToken = "WzL6b1y1lSYvuSyR_luE5wHYs3WcbqBy7VRQCZQD";
const accountIdentifier = "fbed2bc6a3b8f0b029c8a93b70fc01b5";
const myIpAddress = "71.205.60.192";

const url = `https://api.cloudflare.com/client/v4/accounts/${accountIdentifier}/firewall/access_rules/rules`;

const body = {
  mode: "whitelist",
  configuration: {
    target: "ip",
    value: myIpAddress,
  },
  notes: "Whitelist IP for scraping",
};

const options = {
  method: "POST", // or the appropriate method for your request
  headers: {
    Authorization: `Bearer ${apiToken}`, // Ensure this is the correct token
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
};
fetch(url, options)
  .then((response) => response.json())
  .then((data) => {
    if (data.success) {
      console.log("IP successfully whitelisted:", myIpAddress);
    } else {
      console.error("Error whitelisting IP:", data.errors);
    }
  })
  .catch((err) => console.error("Error:", err));

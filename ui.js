(function () {
  "use strict";
  let operation = "encode";
  const mode = document.querySelector("#mode"), input = document.querySelector("#input"), output = document.querySelector("#output"), bits = document.querySelector("#bits"), status = document.querySelector("#status"), receipt = document.querySelector("#receipt");
  const requestedMode = new URLSearchParams(location.search).get("mode");
  if ([...mode.options].some(option => option.value === requestedMode)) mode.value = requestedMode;
  const descriptions = {
    direct: "Lily’s direct formula: U+1F300 + printable ASCII byte. The letter lives in the glyph’s low byte. Space is U+1F320.",
    "lookup-a": "Suite food table. ASCII letters and spaces; its uppercase mapping differs from Direct ASCII. Space is 🐠.",
    "lookup-b": "Suite people table. ASCII letters and spaces. The shared 🐠 carries a space with a null page bit.",
    utf8: "HX2 envelope: exact UTF-8 text and a second bit lane, with byte length and a checksum for each lane. Unicode stays intact."
  };
  function render() {
    output.value = ""; receipt.textContent = "";
    document.querySelector("#mode-note").textContent = descriptions[mode.value];
    document.querySelector("#bits-control").hidden = mode.value !== "utf8" || operation !== "encode";
    document.querySelector("#input-label").textContent = operation === "encode" ? "Plaintext" : "Encoded text";
    try {
      if (input.value.length > 50_000) throw new Error("This visual demo supports up to 50,000 UTF-16 units; use the core for larger inputs.");
      if (mode.value === "direct") {
        output.value = operation === "encode" ? Hexmoji.encodeDirect(input.value) : Hexmoji.decodeDirect(input.value);
        status.textContent = "Exact printable-ASCII mapping · Direct ASCII.";
      } else if (mode.value.startsWith("lookup")) {
        const result = operation === "encode" ? Hexmoji.encodeLookup(input.value, { channel: mode.value === "lookup-b" ? "B" : "A" }) : Hexmoji.decodeLookup(input.value);
        output.value = result.text || "";
        status.textContent = `${result.status || "exact"} primary text · ${result.channelStatus} channel bits`;
        receipt.textContent = JSON.stringify(result, null, 2);
      } else if (operation === "encode") {
        if (bits.value && !/^[01]+$/.test(bits.value)) throw new Error("Channel bits must contain only 0 and 1, without separators.");
        output.value = Hexmoji.encodeUtf8(input.value, bits.value ? [...bits.value].map(Number) : undefined);
        status.textContent = `Exact UTF-8 v2 frame · ${new TextEncoder().encode(input.value).length} bytes · two independently checked lanes.`;
      } else {
        const result = Hexmoji.decodeUtf8(input.value);
        output.value = result.text === null ? "" : result.text;
        status.textContent = `${result.primaryStatus} primary text · ${result.channelStatus} channel bits`;
        receipt.textContent = JSON.stringify(result, null, 2);
      }
    } catch (error) { status.textContent = `Rejected: ${error.message}`; }
  }
  for (const name of ["encode", "decode"]) document.querySelector(`#${name}`).addEventListener("click", () => { operation = name; for (const value of ["encode", "decode"]) document.querySelector(`#${value}`).setAttribute("aria-pressed", String(value === name)); render(); });
  document.querySelector("#use-output").addEventListener("click", () => { input.value = output.value; operation = operation === "encode" ? "decode" : "encode"; document.querySelector(`#${operation}`).click(); });
  for (const element of [input, bits, mode]) element.addEventListener("input", render);
  render();
})();

const checks = [
  ["/coaching-classes-shahdara", "coaching classes in shahdara"],
  ["/classes/class-9", "class 9 tuition in shahdara"],
  ["/classes/class-10", "class 10 tuition in shahdara"],
  ["/classes/class-11-science", "class 11 science coaching in shahdara"],
  ["/classes/class-12-science", "class 12 science coaching in shahdara"],
  ["/jee-coaching-shahdara", "jee coaching in shahdara"],
  ["/neet-coaching-shahdara", "neet coaching in shahdara"],
];

(async () => {
  for (const [p, kw] of checks) {
    const html = await fetch("http://127.0.0.1:3105" + p).then((r) => r.text());
    const text = html
      .replace(/<script[\s\S]*?<\/script>/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .toLowerCase();
    const count = text.split(kw).length - 1;
    const words = text.split(" ").length;
    const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    let bad = 0;
    const types = [];
    for (const m of schemas) {
      try {
        types.push(JSON.parse(m[1])["@type"]);
      } catch {
        bad++;
      }
    }
    console.log(
      p,
      "| kw=" + count,
      "| words=" + words,
      "| density=" + ((100 * count * kw.split(" ").length) / words).toFixed(1) + "%",
      "| badJson=" + bad,
      "| schemas=" + types.join(","),
    );
  }
})();

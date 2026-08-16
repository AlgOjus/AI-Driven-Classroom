const PHET_SIMS = {
    pendulum: "https://phet.colorado.edu/sims/html/pendulum-lab/latest/pendulum-lab_en.html",
    photosynthesis: "https://phet.colorado.edu/sims/html/photosynthesis/latest/photosynthesis_en.html",
    circuit: "https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_en.html",
    wave: "https://phet.colorado.edu/sims/html/wave-on-a-string/latest/wave-on-a-string_en.html",
    gravity: "https://phet.colorado.edu/sims/html/gravity-and-orbits/latest/gravity-and-orbits_en.html",
    energy: "https://phet.colorado.edu/sims/html/energy-forms-and-changes/latest/energy-forms-and-changes_en.html",
    atom: "https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_en.html",
    ohm: "https://phet.colorado.edu/sims/html/ohms-law/latest/ohms-law_en.html",
    force: "https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_en.html",
};

function resolveVisual(type, query) {
    const q = (query || "").toLowerCase();
    if (type === "simulation") {
        const key = Object.keys(PHET_SIMS).find((k) => q.indexOf(k) !== -1);
        return key
            ? { embeddable: true, url: PHET_SIMS[key] }
            : { embeddable: false, url: "https://phet.colorado.edu/en/simulations/filter?search=" + encodeURIComponent(query) };
    }
    if (type === "3d") {
        return { embeddable: false, url: "https://sketchfab.com/search?q=" + encodeURIComponent(query) + "&type=models" };
    }
    if (type === "animation") {
        return { embeddable: false, url: "https://www.youtube.com/results?search_query=" + encodeURIComponent(query + " animation explained") };
    }
    return { embeddable: false, url: "#" };
}

async function resolveAllSuggestions(suggestions) {
    return suggestions.map((s) => {
        const r = resolveVisual(s.type, s.query);
        return Object.assign({}, s, { url: r.url, embeddable: r.embeddable });
    });
}

module.exports = { resolveVisual, resolveAllSuggestions };
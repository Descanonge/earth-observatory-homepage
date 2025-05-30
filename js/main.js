

var choosen = Number(localStorage.getItem("choosen"));
if (choosen == null) {
  choosen = 0;
}

var entries = JSON.parse(localStorage.getItem("entries"));

function update(item) {
  document.getElementById("ve-title").innerHTML = item.title;
  document.getElementById("ve-img").src = `./images/${item.img_file}`;
}


fetch("../images/db.json")
  .then((res) => res.json())
  .then((json) => json.entries)
  .then((entries_json) => {

    // no local storage or update
    if (JSON.stringify(entries) !== JSON.stringify(entries_json)) {
      entries = entries_json;
      choosen = 0;
    }

    update(entries[choosen]);
    setButtonStyle();

    localStorage.setItem("entries", JSON.stringify(entries));
    
  })
  .catch((e) => console.error(e));

function previous() {
  choosen = Math.min(entries.length-1, choosen + 1);
  update(entries[choosen]);
  setButtonStyle()
  localStorage.setItem("choosen", choosen);
}

function next() {
  choosen = Math.max(0, choosen - 1);
  update(entries[choosen]);
  setButtonStyle()
  localStorage.setItem("choosen", choosen);
}

function setButtonStyle() {
  if (choosen == entries.length-1) {
    document.getElementById("ve-prev").classList.add("ve-button-max");
    document.getElementById("ve-prev").classList.remove("ve-button-hover");
  } else {
    document.getElementById("ve-prev").classList.remove("ve-button-max");
    document.getElementById("ve-prev").classList.add("ve-button-hover");
  }
  if (choosen == 0) {
    document.getElementById("ve-next").classList.add("ve-button-max");
    document.getElementById("ve-next").classList.remove("ve-button-hover");
  } else {
    document.getElementById("ve-next").classList.remove("ve-button-max");
    document.getElementById("ve-next").classList.add("ve-button-hover");
  }
}

function toArticle() {
  window.open(entries[choosen].ve_link, "_blank").focus();
}

// Saves options to chrome.storage
function save_options() {
  var token = document.getElementById("token").value;
  var workspace = document.getElementById("workspace").value;
  chrome.storage.sync.set(
    {
      token,
      workspace,
    },
    function () {
      // Update status to let user know options were saved.
      var status = document.getElementById("status");
      status.textContent = "Settings saved.";
      setTimeout(function () {
        status.textContent = "";
      }, 1500);
    }
  );
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get(
    {
      token: "",
      workspace: "",
    },
    function (items) {
      document.getElementById("token").value = items.token;
      document.getElementById("workspace").value = items.workspace;
    }
  );
}
document.addEventListener("DOMContentLoaded", restore_options);
document.getElementById("save").addEventListener("click", save_options);

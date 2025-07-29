import toast from "react-hot-toast";

const successToast = (msg) => {
  toast.success(msg, {
    duration: 4000,
    icon: "✅",
    style: {
      borderRadius: "50px",
      background: "#000",
      color: "#fff",
    },
  });
};

const errorToast = (msg) => {
  toast.error(msg, {
    duration: 4000,
    icon: "❌",
    style: {
      borderRadius: "50px",
      background: "#000",
      color: "#fff",
    },
  });
};

const infoToast = (msg) => {
  toast(msg, {
    duration: 2000,
    icon: "ℹ️",
    position: "top-right",
    style: {
      borderRadius: "0.5rem",
      background: "#000",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      boxShadow:
        "0 10px 24px -3px rgba(0,0,0,0.55), 0 4px 12px -4px rgba(0,0,0,0.45)",
      animation: "am-toast-slide-in 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
    },
  });
};

const warningToast = (msg) => {
  toast.error(msg, {
    duration: 4000,
    icon: "⚠️",
    style: {
      borderRadius: "50px",
      background: "#000",
      color: "#fff",
    },
  });
};
const loadingToast = (() => {
  let toastId = null;

  return (isLoading, msg = "Loading...") => {
    if (isLoading) {
      if (toastId) toast.dismiss(toastId);

      toastId = toast.loading(msg, {
        style: {
          borderRadius: "50px",
          background: "#000",
          color: "#fff",
        },
      });
    } else {
      if (toastId) {
        toast.dismiss(toastId);
        toastId = null;
      }
    }
  };
})();

export { successToast, errorToast, infoToast, warningToast, loadingToast };

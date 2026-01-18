export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

export const slideUp = {
  hidden: { y: 50, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { duration: 0.6, ease: [0.33, 1, 0.68, 1] }
  }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

export const revealText = {
  hidden: { y: "100%" },
  visible: {
    y: "0%",
    transition: { duration: 0.5, ease: [0.33, 1, 0.68, 1] }
  }
};

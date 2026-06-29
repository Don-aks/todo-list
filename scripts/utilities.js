export const getElement = (selector, parent = document) => {
  return parent.querySelector(selector);
};

export const getAllElements = (selector, parent = document) => {
  return parent.querySelectorAll(selector);
};

export const wait = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const getTransitionDurationInMs = (element) => {
  const transitionDuration =
    window.getComputedStyle(element).transitionDuration;

  if (transitionDuration.includes('ms')) {
    return parseFloat(transitionDuration);
  }
  return parseFloat(transitionDuration) * 1000;
};

export const debounce = (func, wait = 150) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

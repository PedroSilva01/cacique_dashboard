// Suppress specific React warnings
const originalError = console.error;

console.error = (...args) => {
  // Suppress UNSAFE_componentWillMount warning and related stack traces
  if (typeof args[0] === 'string') {
    if (args[0].includes('Using UNSAFE_componentWillMount in strict mode') ||
        args[0].includes('Please update the following components:') ||
        (args[0].includes('SideEffect') && args[0].includes('react-side-effect'))) {
      return;
    }
  }
  
  // Suppress warning about legacy context API
  if (args[0] && typeof args[0] === 'string' && 
      args[0].includes('Legacy context API has been detected')) {
    return;
  }

  originalError.apply(console, args);
};

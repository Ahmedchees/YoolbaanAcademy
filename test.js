// Run this in your browser's console to test
async function testLogin() {
  const response = await fetch('https://script.google.com/macros/s/AKfycbzKnONOu2-T6nHxOAgV9GUQozeTRe1KBH3dlghG8E30VTqw1wVCtnC1s17osQWdCblK2A/exec', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'action=studentLogin&rollNo=12345&password=123456789'
  });
  console.log(await response.json());
}
testLogin();






























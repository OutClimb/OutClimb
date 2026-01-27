export function readFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = ({ target }) => {
      if (!target || !target.result || typeof target.result !== 'string') {
        reject('Error with target from FileReader')
        return
      }

      const dataUrl = target.result
      resolve(dataUrl.substring(dataUrl.indexOf(',') + 1))
    }
    reader.onerror = function () {
      reject('Error reading file')
    }
  })
}

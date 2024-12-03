const spriteTemplate = (content: string) => `
    const Sprite = () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="0" height="0">
        ${content}
      </svg>
    );
    
    export default Sprite;
  `;

export default spriteTemplate;

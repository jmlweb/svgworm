const spriteTemplate = (content: string, prefix?: string) => `
    const ${prefix}IconSprite = () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style={{ display: 'none' }}>
        ${content}
      </svg>
    );
    
    export default ${prefix}IconSprite;
  `;

export default spriteTemplate;

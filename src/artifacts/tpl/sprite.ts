import { Config } from '../../config/schemas';

export const spriteTpl = ({
  capitalizedIconName,
  mode,
  content,
}: Pick<Config, 'mode'> & { content: string; capitalizedIconName: string }) => {
  if (mode === 'file') {
    return `<svg xmlns="http://www.w3.org/2000/svg"><defs>${content}</defs></svg>`;
  }

  return `
    export const ${capitalizedIconName}Sprite = () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style={{
        position: 'absolute',
        width: 0,
        height: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}>
        ${content}
      </svg>
    );
  `;
};

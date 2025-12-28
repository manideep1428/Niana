interface Props {
  designId: string;
  title: string;
}

const showDesign = () => {
  console.log(`on click this div it have point that designId on the canvas`);
};

export default function PreviewDesigns({ designId, title }: Props) {
  return (
    <div className="card" onClick={showDesign}>
      {title}{" "}
    </div>
  );
}

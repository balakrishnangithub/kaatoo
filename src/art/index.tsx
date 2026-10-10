import type { ComponentType } from 'react';
import type { ArtProps } from './shared';
import {
  Apple,
  Banana,
  Bird,
  Carrot,
  Cat,
  Cow,
  Dog,
  Elephant,
  Fish,
  Grapes,
  Lion,
  Mango,
  Orange,
  Rabbit,
} from './world1';
import {
  Ball,
  Balloon,
  Book,
  Bus,
  Car,
  Cloud,
  Cup,
  Drum,
  Flower,
  House,
  Moon,
  Shoe,
  StarShape,
  Sun,
  Tree,
} from './world2';
import {
  ShapeCircle,
  ShapeHeart,
  ShapeOval,
  ShapeRect,
  ShapeSquare,
  ShapeStar,
  ShapeTriangle,
} from './shapes';
import { FaceAngry, FaceCalm, FaceHappy, FaceSad, FaceSleepy, FaceSurprised } from './shapes';

export const ART = {
  cat: Cat,
  dog: Dog,
  cow: Cow,
  elephant: Elephant,
  bird: Bird,
  fish: Fish,
  lion: Lion,
  rabbit: Rabbit,
  apple: Apple,
  banana: Banana,
  mango: Mango,
  grapes: Grapes,
  orange: Orange,
  carrot: Carrot,
  ball: Ball,
  car: Car,
  bus: Bus,
  book: Book,
  cup: Cup,
  shoe: Shoe,
  balloon: Balloon,
  drum: Drum,
  sun: Sun,
  moon: Moon,
  star: StarShape,
  flower: Flower,
  tree: Tree,
  cloud: Cloud,
  house: House,
  circle: ShapeCircle,
  square: ShapeSquare,
  triangle: ShapeTriangle,
  rect: ShapeRect,
  starshape: ShapeStar,
  heart: ShapeHeart,
  oval: ShapeOval,
  face_happy: FaceHappy,
  face_sad: FaceSad,
  face_angry: FaceAngry,
  face_surprised: FaceSurprised,
  face_sleepy: FaceSleepy,
  face_calm: FaceCalm,
} satisfies Record<string, ComponentType<ArtProps>>;

export type ArtId = keyof typeof ART;

export function Art({ id, ...p }: ArtProps & { id: ArtId }) {
  const C = ART[id];
  return <C {...p} />;
}

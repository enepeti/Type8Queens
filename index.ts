// ========================= Basics =========================

type Rows = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type Cols = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
type Squares = `${Cols}${Rows}`;
type Empty = "　";
type Queen = "♛";

// ====================== Arithmetics ======================

type SimpleEquals<T, U> = T extends U ? true : false;

type TupleOfLength<N extends number, State extends 0[] = []> = SimpleEquals<
  State["length"],
  N
> extends false
  ? TupleOfLength<N, [...State, 0]>
  : State;

type Inc<N extends number> = [0, ...TupleOfLength<N>] extends infer NTuple extends 0[]
  ? NTuple['length']
  : never;

type AbsSub<N extends number, M extends number> = TupleOfLength<N> extends [
  ...TupleOfLength<M>,
  ...infer Rest
]
  ? Rest["length"]
  : TupleOfLength<M> extends [...TupleOfLength<N>, ...infer Rest]
  ? Rest["length"]
  : 0;

type Or<A extends boolean[]> = A extends [
  infer H extends boolean,
  ...infer T extends boolean[]
]
  ? H extends true
    ? true
    : Or<T>
  : false;

// ====================== Matrix/Vector ======================

type Repeat<
  Times extends number,
  Char,
  State extends unknown[] = []
> = State["length"] extends Times
  ? State
  : Repeat<Times, Char, [...State, Char]>;

type Before<
  Vector extends unknown[],
  Position extends number,
  State extends unknown[] = []
> = State["length"] extends Position
  ? State
  : Before<Vector, Position, [...State, Vector[State["length"]]]>;

type After<Vector extends unknown[], Position extends number> = Vector extends [
  ...Before<Vector, Position>,
  infer _,
  ...infer Rest
]
  ? Rest
  : [];

type Put<
  Vector extends unknown[],
  Position extends number,
  Element
> = Vector extends unknown[]
  ? [...Before<Vector, Position>, Element, ...After<Vector, Position>]
  : Vector;

type Put2D<
  Matrix extends unknown[][],
  PositionY extends number,
  PositionX extends number,
  Element extends unknown
> = Put<
  Matrix,
  PositionY,
  Put<Matrix[PositionY], PositionX, Element>
> extends infer Result extends unknown[][]
  ? Result
  : never;

type Flatten<Vector extends unknown[]> = Vector extends [
  infer Head,
  ...infer Tail
]
  ? [...(Head extends unknown[] ? Flatten<Head> : [Head]), ...Flatten<Tail>]
  : [];

type CountElement<Vector extends unknown[], Element, Result extends number = 0> = Vector extends [
  infer Head,
  ...infer Tail
]
  ? CountElement<Tail, Element, SimpleEquals<Head, Element> extends true
    ? Inc<Result>
    : Result>
  : Result

// ======================= Converters =======================

type RowToNum<Row extends `${Rows}`> = {
  "1": 0;
  "2": 1;
  "3": 2;
  "4": 3;
  "5": 4;
  "6": 5;
  "7": 6;
  "8": 7;
}[Row];

type ColToNum<Col extends Cols> = {
  a: 0;
  b: 1;
  c: 2;
  d: 3;
  e: 4;
  f: 5;
  g: 6;
  h: 7;
}[Col];

type SquareToIndexPair<Square extends Squares> =
  Square extends `${infer Col extends Cols}${infer Row extends `${Rows}`}`
    ? [RowToNum<Row>, ColToNum<Col>]
    : [];

// ====================== Chess Moves ======================

type PossibleRookMove<
  From extends Squares,
  To extends Squares
> = SquareToIndexPair<From> extends [
  infer FromY extends number,
  infer FromX extends number
]
  ? SquareToIndexPair<To> extends [
      infer ToY extends number,
      infer ToX extends number
    ]
    ? Or<[SimpleEquals<ToY, FromY>, SimpleEquals<ToX, FromX>]>
    : never
  : never;

type PossibleBishopMove<
  From extends Squares,
  To extends Squares
> = SquareToIndexPair<From> extends [
  infer FromY extends number,
  infer FromX extends number
]
  ? SquareToIndexPair<To> extends [
      infer ToY extends number,
      infer ToX extends number
    ]
    ? SimpleEquals<AbsSub<ToY, FromY>, AbsSub<ToX, FromX>>
    : never
  : never;

type PossibleQueenMove<From extends Squares, To extends Squares> = Or<
  [PossibleRookMove<From, To>, PossibleBishopMove<From, To>]
>;

// ===================== Game Controls =====================

type EmptyBoard = Repeat<8, Repeat<8, Empty>>;

type IsPossibleSquare<
  Board extends unknown[][],
  Square extends Squares
> = false extends {
  [OtherSquare in Squares]: PossibleQueenMove<Square, OtherSquare> extends false
    ? true
    : SquareToIndexPair<OtherSquare> extends [
        infer Y extends number,
        infer X extends number
      ]
    ? SimpleEquals<Board[Y][X], Queen> extends true
      ? false
      : true
    : never;
}[Squares]
  ? never
  : Square;

type PutQueenToSquare<
  Board extends unknown[][],
  Square extends Squares
> = SquareToIndexPair<Square> extends [
  infer Y extends number,
  infer X extends number
]
  ? Command<Put2D<Board, Y, X, Queen>>
  : never;

type Render<Row extends unknown[], Next> = Row extends [
  infer Head extends string,
  ...infer Tail extends unknown[]
]
  ? { [K in Head]: Render<Tail, Next> }
  : Next;

type Join<B extends unknown[]> = B extends [
  infer Head extends string,
  ...infer Tail
]
  ? `${Head}${Join<Tail>}`
  : "";

type Command<Board extends unknown[][]> = {
  board: GameRender<Board>;
} & {
  [Square in Squares as IsPossibleSquare<Board, Square>]: PutQueenToSquare<
    Board,
    Square
  >;
};

type GameRender<Board extends unknown[][]> = Render<
  {
    [Key in keyof Board]: Join<Board[Key]>;
  },
  [
    Command<Board>,
    Render<['win'], null>,
  ][CountElement<Flatten<Board>, Queen> extends 8 ? 1 : 0]
>;

type Game = Command<EmptyBoard>;

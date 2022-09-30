#include <stdint.h>
#include <stddef.h>

#define M_PI 3.141592653589793
#define GOLDEN_RATIO (1.618034f)
#define ARR_LEN(arr) (sizeof(arr) / sizeof(arr[0]))

static float round_tof(float x, float n) { return n * (int)(x/n); }

#define STB_PERLIN_IMPLEMENTATION
#include "stb_perlin.h"

#define WASM_EXPORT __attribute__((visibility("default")))
extern float cosf(float);
extern float sinf(float);
extern float sqrtf(float);
extern float printf(float);
extern void vbuf(void *ptr, int len);
extern void ibuf(void *ptr, int len);

static float fmaxf(float a, float b) { return (a > b) ? a : b; }
static float fminf(float a, float b) { return (a < b) ? a : b; }

typedef struct { float x, y; } Vec2;
static Vec2 vec2_unit_from_rads(float rads) {
  return (Vec2) { .x = cosf(rads), .y = sinf(rads) };
}
static Vec2 vec2_pivot(Vec2 o, Vec2 v, float rads) {
  float oldX = v.x - o.x;
  float oldY = v.y - o.y;
  return (Vec2) {
    .x = o.x + oldX * cosf(rads) - oldY * sinf(rads),
    .y = o.y + oldX * sinf(rads) + oldY * cosf(rads) 
  };
}

typedef struct { float r, g, b, a; } Color;
WASM_EXPORT Color color_picked = { 0.0f, 0.0f, 0.0f, 1.0f };
#define COLOR_BLACK         ((Color) { 0.00f, 0.00f, 0.00f, 1.00f })
#define COLOR_WHITE         ((Color) { 1.00f, 1.00f, 1.00f, 1.00f })
#define COLOR_BEIGE         ((Color) { 0.72f, 0.64f, 0.53f, 1.00f })
#define COLOR_BROWN         ((Color) { 0.46f, 0.27f, 0.18f, 1.00f })
#define COLOR_DARKBROWN     ((Color) { 0.30f, 0.25f, 0.18f, 1.00f })
#define COLOR_DARKERBROWN   ((Color) { 0.25f, 0.20f, 0.13f, 1.00f })
#define COLOR_BLUE          ((Color) { 0.00f, 0.47f, 0.95f, 1.00f })
#define COLOR_RED           ((Color) { 0.90f, 0.16f, 0.22f, 1.00f })
#define COLOR_MAROON        ((Color) { 0.75f, 0.13f, 0.22f, 1.00f })
#define COLOR_DARKMAROON    ((Color) { 0.55f, 0.03f, 0.12f, 1.00f })
#define COLOR_GREEN         ((Color) { 0.00f, 0.89f, 0.19f, 1.00f })
#define COLOR_LIGHTGREY     ((Color) { 0.78f, 0.78f, 0.78f, 1.00f })
#define COLOR_LIGHTISHGREY  ((Color) { 0.68f, 0.68f, 0.68f, 1.00f })
#define COLOR_GREY          ((Color) { 0.51f, 0.51f, 0.51f, 1.00f })
#define COLOR_DARKGREY      ((Color) { 0.31f, 0.31f, 0.31f, 1.00f })
#define COLOR_YELLOW        ((Color) { 0.99f, 0.98f, 0.00f, 1.00f })

#define COLOR_SLOTCOLOR     ((Color) { 0.42f, 0.40f, 0.39f, 1.00f })
#define COLOR_DARKSLOTCOLOR ((Color) { 0.32f, 0.30f, 0.29f, 1.00f })
#define COLOR_TREEBORDER    ((Color) { 0.00f, 0.42f, 0.13f, 1.00f })
#define COLOR_TREEGREEN     ((Color) { 0.00f, 0.46f, 0.17f, 1.00f })
#define COLOR_TREEGREEN1    ((Color) { 0.04f, 0.50f, 0.21f, 1.00f })
#define COLOR_TREEGREEN2    ((Color) { 0.08f, 0.54f, 0.25f, 1.00f })
#define COLOR_TREEGREEN3    ((Color) { 0.12f, 0.58f, 0.29f, 1.00f })
#define COLOR_BARK          ((Color) { 0.37f, 0.32f, 0.29f, 1.00f })
#define COLOR_GRASS_TOP     ((Color) { 0.15f, 0.61f, 0.33f, 1.00f })
#define COLOR_FORESTSHADOW  ((Color) { 0.01f, 0.46f, 0.27f, 1.00f })
#define COLOR_GRASS_BOTTOM  ((Color) { 0.05f, 0.51f, 0.29f, 1.00f })

typedef struct { Vec2 pos; float z, _pad0; Color color; } Vert;

static struct {
  Vert vbuf[1 << 16];
  uint16_t ibuf[1 << 17];

  int width, height;
  float zoom;

  struct {
    uint8_t active;
    struct { int x, y; } mouse_start;
    struct { float x, y; } cam_start;
  } drag;

  Vec2 cam;
} state = {0};

/* a collection of geometry (vertices, indices) you can write into */
typedef struct {
  Vert *vbuf;
  Vert *vbuf_base;
  size_t vbuf_max;

  uint16_t *ibuf;
  uint16_t *ibuf_base;
  size_t ibuf_max;
} Geo;

/* note: doesn't un-zoom (should it?) */
static Vec2 px_to_world_space(int x, int y) {
  float aspect = (float)state.height / (float)state.width;
  Vec2 ret = { x, y };
  ret.x /= state.width;
  ret.y /= state.height;
  
  ret.x /= aspect;
  return ret;
}

static void geo_apply_cam(Geo *geo, float width, float height) {
  float min_z = -1.0f;
  float max_z =  1.0f;

  for (Vert *p = geo->vbuf_base; p != geo->vbuf; p++)
    min_z = (p->z < min_z) ? p->z : min_z,
    max_z = (p->z > max_z) ? p->z : max_z;

  /* more width: show more
     more height: zoom in */
  float aspect = (float)height / (float)width;
  for (Vert *p = geo->vbuf_base; p != geo->vbuf; p++) {
    p->pos.x += state.cam.x;
    p->pos.y += state.cam.y;

    p->pos.x *= aspect;
    p->z = ((p->z - min_z) / (max_z - min_z))*2.0f - 1.0f;
    p->z *= 0.99999f;

    // zoom
    p->pos.x /= state.zoom;
    p->pos.y /= state.zoom;

    // 0..1 is good actually
    p->pos.x = p->pos.x * 2.0f - 1.0f;
    p->pos.y = p->pos.y * 2.0f - 1.0f;
  }
}

static void geo_ibuf_push(Geo *geo, uint16_t a, uint16_t b, uint16_t c) {
  if ((geo->ibuf - geo->ibuf_base) < geo->ibuf_max)
    *geo->ibuf++ = a, *geo->ibuf++ = b, *geo->ibuf++ = c;
  else
    printf(500);
}

static void geo_vbuf_push(Geo *geo, Vert v) {
  if ((geo->vbuf - geo->vbuf_base) < geo->vbuf_max)
    *geo->vbuf++ = v;
  else
    printf(500);
}

static void geo_quad(Geo *geo, Vert tl, Vert tr, Vert br, Vert bl) {
  int i = geo->vbuf - geo->vbuf_base;

  geo_vbuf_push(geo, tl);
  geo_vbuf_push(geo, tr);
  geo_vbuf_push(geo, br);
  geo_vbuf_push(geo, bl);

  geo_ibuf_push(geo, i+0, i+1, i+2);
  geo_ibuf_push(geo, i+2, i+1, i+3);
}

static void geo_tri(Geo *geo, Vert a, Vert b, Vert c) {
  int i = geo->vbuf - geo->vbuf_base;

  geo_vbuf_push(geo, a);
  geo_vbuf_push(geo, b);
  geo_vbuf_push(geo, c);

  geo_ibuf_push(geo, i+0, i+1, i+2);
}

static void geo_ngon(Geo *geo, Color c, float z, float x, float y, float r, float n) {
  int i;
  int center = geo->vbuf - geo->vbuf_base;
  geo_vbuf_push(geo, (Vert) { .pos = { x, y }, .z=z, .color = c });

  #define CIRC_VERT(n) ((Vert) {   \
      .pos = { x + cosf(a*n)*r,    \
               y + sinf(a*n)*r  }, \
      .z = z,                      \
      .color = c                   \
    })

  float a = (M_PI*2)/n;
  int start = geo->vbuf - geo->vbuf_base;
  geo_vbuf_push(geo, CIRC_VERT(1));

  for (int ni = 2; ni < (n+1); ni++) {
    i = geo->vbuf - geo->vbuf_base;
    geo_vbuf_push(geo, CIRC_VERT(ni));
    geo_ibuf_push(geo, i, center, i-1);
  }

  geo_ibuf_push(geo, start, center, i);
}
static void geo_8gon(Geo *geo, Color c, float z, float x, float y, float r) {
  geo_ngon(geo, c, z, x, y, r, 8.0f);
}

static void geo_line(Geo *geo, Color c, float z, Vec2 beg, Vec2 end, float thickness) {
  float dx = end.x - beg.x;
  float dy = end.y - beg.y;

  // https://stackoverflow.com/questions/begend436beg4/how-do-i-calculate-the-normal-vector-of-a-line-segment

  float nx = -dy;
  float ny = dx;

  float tlen = sqrtf(nx * nx + ny * ny) / (thickness * 0.5);
  if (tlen < 0.00000001f) return;
  float tx = nx / tlen;
  float ty = ny / tlen;

  geo_quad(geo,
    (Vert) { .pos = { beg.x + tx, beg.y + ty }, .z=z, .color = c },
    (Vert) { .pos = { beg.x - tx, beg.y - ty }, .z=z, .color = c },
    (Vert) { .pos = { end.x + tx, end.y + ty }, .z=z, .color = c },
    (Vert) { .pos = { end.x - tx, end.y - ty }, .z=z, .color = c }
  );
}

static void geo_rect(Geo *geo, Color c, float z, float x, float y, float w, float h) {
  geo_line(geo, c, z, (Vec2) { .x = x-w/2, .y = y},
                      (Vec2) { .x = x+w/2, .y = y}, h);
}

static void geo_tree(Geo *geo, float x, float _y, float size) {
  Vert *start = geo->vbuf;
  float w = 0.8f, h = GOLDEN_RATIO, r = 0.4f;
  float y = _y - 0.2f;

  geo_ngon(geo, COLOR_BARK, y, x,       y + r, r, 32);
  geo_rect(geo, COLOR_BARK, y, x, h/2 + y + r, w, h);

  geo_8gon(geo, COLOR_TREEGREEN , y - 1.8f, x + 0.80f, y + 2.2f, 0.8f);
  geo_8gon(geo, COLOR_TREEGREEN1, y - 1.8f, x + 0.16f, y + 3.0f, 1.0f);
  geo_8gon(geo, COLOR_TREEGREEN2, y - 1.8f, x - 0.80f, y + 2.5f, 0.9f);
  geo_8gon(geo, COLOR_TREEGREEN3, y - 1.8f, x - 0.16f, y + 2.0f, 0.8f);

  geo_8gon(geo, COLOR_TREEBORDER, y, x + 0.80f, y + 2.2f, 0.8f+0.1f);
  geo_8gon(geo, COLOR_TREEBORDER, y, x + 0.16f, y + 3.0f, 1.0f+0.1f);
  geo_8gon(geo, COLOR_TREEBORDER, y, x - 0.80f, y + 2.5f, 0.9f+0.1f);
  geo_8gon(geo, COLOR_TREEBORDER, y, x - 0.16f, y + 2.0f, 0.8f+0.1f);

  float sr = 1.22f;
  geo_8gon(geo, COLOR_FORESTSHADOW, y + sr, x, y + r, sr);

  for (Vert *v = start; v != geo->vbuf; v++)
    v->pos.x += (size - 1.0f) * (v->pos.x -  x),
    v->pos.y += (size - 1.0f) * (v->pos.y - _y),
    v->    z += (size - 1.0f) * (v->    z - _y);
}

WASM_EXPORT void init(void) {
  state.zoom = 5.0f;
  vbuf(state.vbuf, ARR_LEN(state.vbuf));
  ibuf(state.ibuf, ARR_LEN(state.ibuf));
}

typedef enum {
  MouseEventKind_Down,
  MouseEventKind_Up,
  MouseEventKind_Move,
} MouseEventKind;
WASM_EXPORT void mouse(MouseEventKind mouse_event_kind, int x, int y) {
  switch (mouse_event_kind) {
    case MouseEventKind_Up: 
      state.drag.active = 0;
      break;
    case MouseEventKind_Down: 
      if (!state.drag.active) {
        state.drag.active = 1;
        state.drag.mouse_start.x = x;
        state.drag.mouse_start.y = y;
        state.drag.cam_start.x = state.cam.x;
        state.drag.cam_start.y = state.cam.y;
      }
      break;
    case MouseEventKind_Move: 
      if (state.drag.active) {
        Vec2 p = px_to_world_space(
          x - state.drag.mouse_start.x,
          y - state.drag.mouse_start.y 
        );
        state.cam.x = state.drag.cam_start.x + p.x * state.zoom;
        state.cam.y = state.drag.cam_start.y - p.y * state.zoom;
      }
      break;
  }
}

WASM_EXPORT void zoom(int x, int y, float delta_pixels) {
  float t = 1.0f - delta_pixels / fmaxf(state.width, state.height);
  #define X_SIZE (state.zoom * (float)state. width)
  #define Y_SIZE (state.zoom * (float)state.height)
  float x_size_before = X_SIZE;
  float y_size_before = Y_SIZE;

  /* --- apply zoom --- */
  state.zoom *= t;
  printf(state.zoom);

  Vec2 p = px_to_world_space(
    (x_size_before - X_SIZE)/2.0f,
    (y_size_before - Y_SIZE)/2.0f
  );
  state.cam.x -= p.x;
  state.cam.y -= p.y;

  #undef X_SIZE
  #undef Y_SIZE
}

WASM_EXPORT void frame(int width, int height, float dt) {
  state. width =  width;
  state.height = height;

  Geo geo = {
    .vbuf      = state.vbuf,
    .vbuf_base = state.vbuf,
    .vbuf_max  = ARR_LEN(state.vbuf),
    .ibuf      = state.ibuf,
    .ibuf_base = state.ibuf,
    .ibuf_max  = ARR_LEN(state.ibuf),
  };
  __builtin_memset(state.ibuf, 0, sizeof(state.ibuf));

  float aspect = (float)width/(float)height;

  // geo_rect(&geo, COLOR_GREEN, -0.1f, 0.1f,0.1f, 0.2f,0.2f);
  // geo_rect(&geo, COLOR_RED  , -0.2f, 0.0f,0.0f, 0.2f,0.2f);
  // geo_rect(&geo, COLOR_BLUE , -0.3f, 0.2f,0.2f, 0.2f,0.2f);

  Vec2 min = { -round_tof(state.cam.x, 0.1f) - 3.0f,
               -round_tof(state.cam.y, 0.1f) - 3.0f };
  Vec2 max = { min.x + state.zoom * aspect   + 6.0f,
               min.y + state.zoom            + 6.0f };

  for (  float x = min.x+0.05f; x < max.x; x += 0.1f)
    for (float y = min.y+0.05f; y < max.y; y += 0.1f) {
      int ix = x/0.1f;
      int iy = y/0.1f;

      float gpn = fabsf(stb_perlin_fbm_noise3(x*0.4f,y*0.4f,0.0f, 2,0.5f,6))*3;
      gpn = fminf(gpn, 2.0f);
      // geo_rect(&geo, COLOR_GRASS_TOP, y, x,y, size,size);
      Color c = COLOR_GRASS_TOP;
      float gx = (iy%2) ? x + 0.05f : x;
      float gy = y;
      geo_tri(&geo, (Vert) { .color=c, .z=y, .pos={ gx-0.01f*gpn, gy           } },
                    (Vert) { .color=c, .z=y, .pos={ gx+0.01f*gpn, gy           } },
                    (Vert) { .color=c, .z=y, .pos={ gx           , gy+0.09f*gpn } });

      if ((ix % 8) == 0 &&
          (iy % 8) == 0 ) {
        float size = fabsf(stb_perlin_fbm_noise3(x*0.1f,y*0.1f,0.0f, 2,0.5f,6));
        if (size > 0.35f)
          geo_tree(&geo, ix*0.1f+gpn*0.1f,
                         iy*0.1f+gpn*0.8f, fminf(0.42f, (size-0.30f)*4.0f));
      }
    }

  geo_apply_cam(&geo, width, height);

  geo_rect(&geo, COLOR_GRASS_BOTTOM, 0.99f, -0.0f,-0.0f, 2.0f,2.0f);
}

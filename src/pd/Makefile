LIBPD_DIR = ../../../

SRC_FILES = loader.c
TARGET = loader.js

CFLAGS = -I$(LIBPD_DIR)/pure-data/src -I$(LIBPD_DIR)/libpd_wrapper -O3
LDFLAGS = -L$(LIBPD_DIR)/build/libs -lpd -lm

.PHONY: clean clobber

$(TARGET): $(SRC_FILES) 
	emcc $(CFLAGS) -o $(TARGET) $(SRC_FILES) --closure 1 -s ERROR_ON_UNDEFINED_SYMBOLS=0 -s FORCE_FILESYSTEM=1 $(LDFLAGS) -s EXPORTED_FUNCTIONS=["_malloc","_free"]

clean:
	rm $(TARGET) $(TARGET:.js=.wasm)
